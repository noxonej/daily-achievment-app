import Capacitor
import CoreMotion
import Foundation

/// "SquzoSteps" for the web page: same methods as the Android version (SquzoStepsPlugin.java).
///
/// The iPhone's motion chip counts steps all day by itself, even when every app is closed, and keeps
/// the last 7 days. CMPedometer just asks it, so no background work is needed here.
@objc(SquzoStepsPlugin)
public class SquzoStepsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SquzoStepsPlugin"
    public let jsName = "SquzoSteps"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAccess", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getToday", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getHistory", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startLive", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopLive", returnType: CAPPluginReturnPromise),
    ]

    private static let source = "ios-motion"
    private let pedometer = CMPedometer()
    private var live = false

    private static let dayFormat: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private func status() -> [String: Any] {
        let permission: String
        switch CMPedometer.authorizationStatus() {
        case .authorized: permission = "granted"
        case .denied, .restricted: permission = "denied"
        default: permission = "prompt"
        }
        return ["available": CMPedometer.isStepCountingAvailable(), "permission": permission, "source": Self.source]
    }

    @objc func getStatus(_ call: CAPPluginCall) {
        call.resolve(status())
    }

    /// iOS shows its "Motion & Fitness" question the first time we ask for steps, so we just ask once.
    @objc func requestAccess(_ call: CAPPluginCall) {
        guard CMPedometer.isStepCountingAvailable() else {
            call.resolve(status())
            return
        }
        let now = Date()
        pedometer.queryPedometerData(from: Calendar.current.startOfDay(for: now), to: now) { [weak self] _, _ in
            DispatchQueue.main.async { call.resolve(self?.status() ?? [:]) }
        }
    }

    @objc func getToday(_ call: CAPPluginCall) {
        let now = Date()
        steps(from: Calendar.current.startOfDay(for: now), to: now) { steps, error in
            if let error = error {
                call.reject(error.localizedDescription)
                return
            }
            call.resolve(["date": Self.dayFormat.string(from: now), "steps": steps, "source": Self.source])
        }
    }

    /// The iPhone keeps 7 days; older days come back as 0.
    @objc func getHistory(_ call: CAPPluginCall) {
        let count = max(1, min(60, call.getInt("days") ?? 7))
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        var result = [[String: Any]](repeating: [:], count: count)
        let group = DispatchGroup()
        for i in 0..<count {
            guard let start = cal.date(byAdding: .day, value: -(count - 1 - i), to: today),
                  let end = cal.date(byAdding: .day, value: 1, to: start) else { continue }
            group.enter()
            steps(from: start, to: min(end, Date())) { steps, _ in
                result[i] = ["date": Self.dayFormat.string(from: start), "steps": steps]
                group.leave()
            }
        }
        group.notify(queue: .main) {
            call.resolve(["days": result])
        }
    }

    @objc func startLive(_ call: CAPPluginCall) {
        guard CMPedometer.isStepCountingAvailable() else {
            call.reject("Step counting is not available on this device.")
            return
        }
        if !live {
            live = true
            let start = Calendar.current.startOfDay(for: Date())
            pedometer.startUpdates(from: start) { [weak self] data, _ in
                guard let self = self, let data = data else { return }
                DispatchQueue.main.async {
                    self.notifyListeners("stepsChanged", data: [
                        "date": Self.dayFormat.string(from: start),
                        "steps": data.numberOfSteps.intValue,
                    ])
                }
            }
        }
        call.resolve()
    }

    @objc func stopLive(_ call: CAPPluginCall) {
        if live { pedometer.stopUpdates() }
        live = false
        call.resolve()
    }

    private func steps(from start: Date, to end: Date, done: @escaping (Int, Error?) -> Void) {
        pedometer.queryPedometerData(from: start, to: end) { data, error in
            DispatchQueue.main.async { done(data?.numberOfSteps.intValue ?? 0, error) }
        }
    }
}
