package app.squzo.stepsdemo;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.HandlerThread;
import androidx.annotation.NonNull;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Wakes up about every 15 minutes (Android decides the exact time, and keeps doing it after a
 * restart) to read the step counter once, so steps land on the right day even if the app stays
 * closed all day.
 */
public class StepWorker extends Worker {
    private static final String WORK_NAME = "squzo-steps";

    public StepWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    static void schedule(Context context) {
        PeriodicWorkRequest request =
            new PeriodicWorkRequest.Builder(StepWorker.class, 15, TimeUnit.MINUTES).build();
        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();
        SensorManager sensors = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
        Sensor counter = sensors == null ? null : sensors.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (counter == null) return Result.success();

        final CountDownLatch got = new CountDownLatch(1);
        final float[] value = { -1 };
        HandlerThread thread = new HandlerThread("squzo-steps");
        thread.start();
        SensorEventListener listener = new SensorEventListener() {
            @Override
            public void onSensorChanged(SensorEvent event) {
                value[0] = event.values[0];
                got.countDown();
            }

            @Override
            public void onAccuracyChanged(Sensor sensor, int accuracy) {}
        };
        try {
            // The step counter reports its current number right after we start listening.
            sensors.registerListener(listener, counter, SensorManager.SENSOR_DELAY_NORMAL, new Handler(thread.getLooper()));
            got.await(10, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        } finally {
            sensors.unregisterListener(listener);
            thread.quitSafely();
        }
        if (value[0] >= 0) StepStore.record(context, value[0]);
        return Result.success();
    }
}
