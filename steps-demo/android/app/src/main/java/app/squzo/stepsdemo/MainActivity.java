package app.squzo.stepsdemo;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Our own plugin lives in this app (not in npm), so it is registered by hand,
        // before the web view starts.
        registerPlugin(SquzoStepsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
