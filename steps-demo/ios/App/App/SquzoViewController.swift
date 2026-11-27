import Capacitor
import UIKit

/// Capacitor's normal screen, plus our own step plugin (it lives in this app, not in npm).
class SquzoViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(SquzoStepsPlugin())
    }
}
