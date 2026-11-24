package app.squzo.stepsdemo;

import android.content.Context;
import android.content.SharedPreferences;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Turns the phone's step counter into "steps per day".
 *
 * Android's step counter sensor is a chip that counts every step since the phone was switched on,
 * even while every app is closed. It only gives one growing number, so we save that number from
 * time to time (while the app is open, and every ~15 minutes in the background) and add the
 * difference to today's total.
 */
final class StepStore {
    private static final String PREFS = "squzo_steps";
    private static final String KEY_LAST_COUNTER = "lastCounter";
    private static final String KEY_DAYS = "days";
    private static final int KEEP_DAYS = 60;

    private StepStore() {}

    static String dayKey(Date date) {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(date);
    }

    static String today() {
        return dayKey(new Date());
    }

    /** Saves a new reading of the sensor. Returns today's total afterwards. */
    static synchronized long record(Context context, float counterValue) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        long counter = (long) counterValue;
        long last = prefs.getLong(KEY_LAST_COUNTER, -1);
        JSONObject days = readDays(prefs);
        String today = today();

        long delta;
        if (last < 0) {
            // First reading ever: we can't know which of these steps were today, so start at 0.
            delta = 0;
        } else if (counter < last) {
            // The number went down, so the phone restarted and the chip began again at 0.
            delta = counter;
        } else {
            delta = counter - last;
        }

        long total = days.optLong(today, 0) + delta;
        try {
            days.put(today, total);
        } catch (JSONException ignored) {
            // Can't happen for a String key and long value.
        }
        trim(days);
        prefs.edit().putLong(KEY_LAST_COUNTER, counter).putString(KEY_DAYS, days.toString()).apply();
        return total;
    }

    static long stepsOn(Context context, String day) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        return readDays(prefs).optLong(day, 0);
    }

    private static JSONObject readDays(SharedPreferences prefs) {
        try {
            return new JSONObject(prefs.getString(KEY_DAYS, "{}"));
        } catch (JSONException e) {
            return new JSONObject();
        }
    }

    /** Forgets days older than KEEP_DAYS so the saved data stays tiny. */
    private static void trim(JSONObject days) {
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_YEAR, -KEEP_DAYS);
        String oldest = dayKey(cal.getTime());
        java.util.List<String> drop = new java.util.ArrayList<>();
        java.util.Iterator<String> keys = days.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            if (key.compareTo(oldest) < 0) drop.add(key);
        }
        for (String key : drop) days.remove(key);
    }
}
