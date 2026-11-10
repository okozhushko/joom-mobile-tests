package mobile.locators;

public final class JoomHomePageLocators {
    public static final String ENABLE_NOTIFICATIONS_BTN = "//android.widget.Button[@resource-id='com.joom:id/enable_action']";
    public static final String ALLOW_NOTIFICATIONS_BTN = "//android.widget.Button[@resource-id='com.android.permissioncontroller:id/permission_allow_button']";
    // Positional and generic locators below need stable resource-ids or content-desc from Appium Inspector.
    public static final String PROFILE_BTN = "(//android.view.ViewGroup[@resource-id='com.joom:id/container'])[6]";
    public static final String SPIN_WHEEL_BTN = "//android.widget.Button";
    public static final String BACK_HOME_SCREEN_BTN = "//android.widget.Button";
    public static final String ACCEPT_ALL_BTN = "//android.widget.TextView[@resource-id='com.joom:id/button_title' and @text='Accept all']";

    private JoomHomePageLocators() {
    }
}
