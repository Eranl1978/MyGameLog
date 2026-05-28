package com.erangamezone.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        if (FirebaseApp.getApps(this).isEmpty()) {
            FirebaseOptions options = new FirebaseOptions.Builder()
                    .setApiKey("AIzaSyAP0kY9Lv4lMIe21X_5cmSD37uoFopsPSI")
                    .setApplicationId("1:865338255165:web:3e6447cd55f63fb93f8754")
                    .setProjectId("erangamezone")
                    .setStorageBucket("erangamezone.firebasestorage.app")
                    .build();

            FirebaseApp.initializeApp(this, options);
        }

        super.onCreate(savedInstanceState);
    }
}
