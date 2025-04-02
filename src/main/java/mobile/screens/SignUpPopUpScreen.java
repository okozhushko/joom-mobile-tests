package mobile.screens;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.pagefactory.AndroidFindBy;
import io.appium.java_client.pagefactory.AppiumFieldDecorator;
import lombok.Setter;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import mobile.dto.AddUserData;
import mobile.enums.AccountTitle;
import mobile.helper.Helper;
import mobile.locators.SignUpPopupLocators;
import mobile.utils.WaitUtils;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@Setter
public class SignUpPopUpScreen extends BaseScreen {
    private WaitUtils waitUtils;

    public SignUpPopUpScreen(AppiumDriver driver) {
        super(driver);
        PageFactory.initElements(new AppiumFieldDecorator(driver), this);
        this.waitUtils = new WaitUtils(driver);
    }

    @AndroidFindBy(xpath = SignUpPopupLocators.SIGNUP_BTN)
    private WebElement signUpBtn;

    public void signUp() {
        waitUtils.waitUntilClickable(signInButton);
        signInButton.click();
    }

    @AndroidFindBy(xpath = SignUpPopupLocators.SIGNUP_FIRST_NAME_FIELD)
    private WebElement firstNameFld;

    public void setFirstName(String firstName) {
        waitUtils.waitUntilClickable(firstNameFld);
        firstNameFld.click();
        firstNameFld.sendKeys(firstName);
    }

    @AndroidFindBy(xpath = SignUpPopupLocators.SIGNUP_LAST_NAME_FIELD)
    private WebElement lastNameFld;

    public void setLastName(String lastName) {
        waitUtils.waitUntilClickable(lastNameFld);
        lastNameFld.click();
        lastNameFld.sendKeys(lastName);
    }

    @AndroidFindBy(xpath = SignUpPopupLocators.SIGNUP_EMAIL_FIELD)
    private WebElement emailFld;

    public void setEmailFld(String emailName) {
        waitUtils.waitUntilClickable(emailFld);
        emailFld.click();
        emailFld.sendKeys(emailName);
    }

    @AndroidFindBy(xpath = SignUpPopupLocators.SIGNUP_PASS_FIELD)
    private WebElement passwordFld;

    public void setPasswordFld(String password) {
        waitUtils.waitUntilClickable(passwordFld);
        passwordFld.click();
        passwordFld.sendKeys(password);
    }

    @AndroidFindBy(xpath = SignUpPopupLocators.SIGNUP_PASS_CONFIRM_FIELD)
    private WebElement confirmPasswordFld;

    public void setConfirmPasswordFld(String password) {
        waitUtils.waitUntilClickable(confirmPasswordFld);
        confirmPasswordFld.click();
        confirmPasswordFld.sendKeys(password);
    }

    @AndroidFindBy(xpath = SignUpPopupLocators.SIGN_IN_BTN)
    private WebElement signInButton;

    public void clickSignInBtn() {
        waitUtils.waitUntilClickable(signInButton);
        signInButton.click();
        log.info("Sign in button: clicked");
    }

    @AndroidFindBy(xpath = SignUpPopupLocators.SIGNUP_BTN)
    private WebElement signUpButton;

    public void clickConfirmSignUpBtn() {
        waitUtils.waitUntilClickable(signUpButton);
        signUpButton.click();
        log.info("Sign up button: clicked");
    }

    @SneakyThrows
    public SignUpPopUpScreen registrationNewUser(AddUserData addUserData) {
        signUp();
        setFirstName(addUserData.getUserFirstName());
        setLastName(addUserData.getUserLastName());
        setEmailFld(addUserData.getUserEmail());
        setPasswordFld(addUserData.getUserPassword());
        setConfirmPasswordFld(addUserData.getUserPasswordConfirmation());
        clickConfirmSignUpBtn();
        log.info("Registration: User '{}' successful", addUserData.getUserEmail());
        return this;
    }

    public void verifyUserRegistered(AccountTitle accountTitle) {
        assertThat(Helper.isTextOnScreen(accountTitle.getValue()))
                .as("Check if text '%s' is visible on the screen", accountTitle.getValue())
                .isTrue();

        log.info("Verified '{}' text is visible", accountTitle.getValue());

    }
}
