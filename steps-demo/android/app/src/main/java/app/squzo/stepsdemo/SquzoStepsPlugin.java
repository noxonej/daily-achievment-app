package app.squzo.stepsdemo;

import android.Manifest;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.Calendar;

/**
 * "SquzoSteps" for the web page: same methods as the iPhone version (ios/App/App/SquzoStepsPlugin.swift).
 *
 *   getStatus()      -> { available, permission: "granted" | "denied" | "prompt", source }
 *   requestAccess()  -> same as getStatus(), after asking the person
 *   getToday()       -> { date, steps, source }
 *   getHistory({ days: 7 }) -> { days: [{ date, steps }, ...] } oldest first
 *   startLive() / stopLive(), and the "stepsChanged" event with { date, steps }
 */
@CapacitorPlugin(
    name = "SquzoSteps",
    permissions = { @Permission(strings = { Manifest.permission.ACTIVITY_RECOGNITION }, alias = "activity") }
)
public class SquzoStepsPlugin extends Plugin implements SensorEventListener {
    private static final String SOURCE = "android-step-counter";
    private SensorManager sensors;
    private Sensor counter;
    private boolean live = false;

    @Override
    public void load() {
        sensors = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        counter = sensors == null ? null : sensors.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (counter != null && hasAccess()) StepWorker.schedule(getContext());
    }

    private boolean hasAccess() {
        // Before Android 10 the step counter needs no permission.
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.Q || getPermissionState("activity") == PermissionState.GRANTED;
    }

    private JSObject status() {
        JSObject out = new JSObject();
        out.put("available", counter != null);
        String permission;
        if (hasAccess()) permission = "granted";
        else if (getPermissionState("activity") == PermissionState.DENIED) permission = "denied";
        else permission = "prompt";
        out.put("permission", permission);
        out.put("source", SOURCE);
        return out;
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void requestAccess(PluginCall call) {
        if (counter == null || hasAccess()) {
            afterAccess(call);
            return;
        }
        requestPermissionForAlias("activity", call, "accessCallback");
    }

    @PermissionCallback
    private void accessCallback(PluginCall call) {
        afterAccess(call);
    }

    private void afterAccess(PluginCall call) {
        if (counter != null && hasAccess()) {
            StepWorker.schedule(getContext());
            readOnce();
        }
        call.resolve(status());
    }

    @PluginMethod
    public void getToday(PluginCall call) {
        JSObject out = new JSObject();
        out.put("date", StepStore.today());
        out.put("steps", StepStore.stepsOn(getContext(), StepStore.today()));
        out.put("source", SOURCE);
        call.resolve(out);
    }

    @PluginMethod
    public void getHistory(PluginCall call) {
        int days = Math.max(1, Math.min(60, call.getInt("days", 7)));
        JSArray list = new JSArray();
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_YEAR, -(days - 1));
        for (int i = 0; i < days; i++) {
            String key = StepStore.dayKey(cal.getTime());
            JSObject day = new JSObject();
            day.put("date", key);
            day.put("steps", StepStore.stepsOn(getContext(), key));
            list.put(day);
            cal.add(Calendar.DAY_OF_YEAR, 1);
        }
        JSObject out = new JSObject();
        out.put("days", list);
        call.resolve(out);
    }

    @PluginMethod
    public void startLive(PluginCall call) {
        if (counter == null || !hasAccess()) {
            call.reject("Step counting is not allowed or not available on this phone.");
            return;
        }
        if (!live) {
            sensors.registerListener(this, counter, SensorManager.SENSOR_DELAY_UI);
            live = true;
        }
        call.resolve();
    }

    @PluginMethod
    public void stopLive(PluginCall call) {
        stopListening();
        call.resolve();
    }

    /** Reads the counter once so today's number is fresh right after access is given. */
    private void readOnce() {
        if (live || counter == null) return;
        sensors.registerListener(new SensorEventListener() {
            @Override
            public void onSensorChanged(SensorEvent event) {
                sensors.unregisterListener(this);
                emit(StepStore.record(getContext(), event.values[0]));
            }

            @Override
            public void onAccuracyChanged(Sensor sensor, int accuracy) {}
        }, counter, SensorManager.SENSOR_DELAY_NORMAL);
    }

    private void stopListening() {
        if (live && sensors != null) sensors.unregisterListener(this);
        live = false;
    }

    private void emit(long steps) {
        JSObject data = new JSObject();
        data.put("date", StepStore.today());
        data.put("steps", steps);
        notifyListeners("stepsChanged", data);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        emit(StepStore.record(getContext(), event.values[0]));
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    @Override
    protected void handleOnDestroy() {
        stopListening();
    }
}
