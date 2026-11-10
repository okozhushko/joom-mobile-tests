package mobile.screens;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.pagefactory.AndroidFindBy;
import lombok.extern.slf4j.Slf4j;
import mobile.dto.NewUser;
import mobile.locators.SignUpPopupLocators;
import org.openqa.selenium.WebElement;

@Slf4j
public class SignUpPopUpScreen extends BaseScreen {

    @AndroidFindBy(xpath = SignUpPopupLocators.OPEN_SIGNUP_FORM_LINK)
    private WebElement openSignUpFormLink;

    @AndroidFindBy(xpath = SignUpPopupLocators.FIRST_NAME_FIELD)
    private WebElement firstNameField;

    @AndroidFindBy(xpath = SignUpPopupLocators.LAST_NAME_FIELD)
    private WebElement lastNameField;

    @AndroidFindBy(xpath = SignUpPopupLocators.EMAIL_FIELD)
    private WebElement emailField;

    @AndroidFindBy(xpath = SignUpPopupLocators.PASSWORD_FIELD)
    private WebElement passwordField;

    @AndroidFindBy(xpath = SignUpPopupLocators.PASSWORD_CONFIRM_FIELD)
    private WebElement passwordConfirmField;

    @AndroidFindBy(xpath = SignUpPopupLocators.SUBMIT_SIGNUP_BTN)
    private WebElement submitButton;

    public SignUpPopUpScreen(AppiumDriver driver) {
        super(driver);
    }

    public ProfileScreen register(NewUser user) {
        waitUtils.waitUntilClickable(openSignUpFormLink);
        openSignUpFormLink.click();

        type(firstNameField, user.firstName());
        type(lastNameField, user.lastName());
        type(emailField, user.email());
        type(passwordField, user.password());
        type(passwordConfirmField, user.password());

        waitUtils.waitUntilClickable(submitButton);
        submitButton.click();
        log.info("Registration form submitted");
        return new ProfileScreen(driver);
    }

    private void type(WebElement field, String text) {
        waitUtils.waitUntilClickable(field);
        field.click();
        field.sendKeys(text);
    }
}
