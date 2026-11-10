package mobile.locators;

public final class SignUpPopupLocators {
    /** "Sign up" text link on the email sign-in popup; switches it to the registration form. */
    public static final String OPEN_SIGNUP_FORM_LINK = "(//android.widget.TextView[@resource-id='com.joom:id/register_button'])[1]";
    /** Submit button of the registration form. */
    public static final String SUBMIT_SIGNUP_BTN = "(//android.widget.Button[@resource-id='com.joom:id/register_button'])[1]";
    public static final String FIRST_NAME_FIELD = "//android.widget.EditText[@resource-id='com.joom:id/input_first_name_field']";
    public static final String LAST_NAME_FIELD = "//android.widget.EditText[@resource-id='com.joom:id/input_last_name_field']";
    public static final String EMAIL_FIELD = "//android.widget.EditText[@resource-id='com.joom:id/input_email_field']";
    public static final String PASSWORD_FIELD = "//android.widget.EditText[@resource-id='com.joom:id/input_password_field']";
    public static final String PASSWORD_CONFIRM_FIELD = "//android.widget.EditText[@resource-id='com.joom:id/input_password_confirmation_field']";

    private SignUpPopupLocators() {
    }
}
