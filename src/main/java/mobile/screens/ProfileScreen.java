package mobile.screens;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.pagefactory.AndroidFindBy;
import lombok.extern.slf4j.Slf4j;
import mobile.locators.LoginPageLocators;
import org.openqa.selenium.WebElement;

@Slf4j
public class ProfileScreen extends BaseScreen {

    /** Shows "Log in" for a guest and the user's full name once signed in; tapping it as a guest opens login. */
    @AndroidFindBy(xpath = LoginPageLocators.PROFILE_HEADER)
    private WebElement profileHeader;

    @AndroidFindBy(xpath = LoginPageLocators.MORE_OPTIONS_BTN)
    private WebElement moreOptionsButton;

    @AndroidFindBy(xpath = LoginPageLocators.EMAIL_BTN)
    private WebElement emailButton;

    public ProfileScreen(AppiumDriver driver) {
        super(driver);
    }

    /** Returns the header text once it contains {@code expected}, or whatever it shows when the wait times out. */
    public String waitForHeaderText(String expected) {
        waitUtils.waitUntilVisible(profileHeader);
        waitUtils.waitForText(profileHeader, expected);
        return profileHeader.getText();
    }

    public SignUpPopUpScreen openEmailSignIn() {
        waitUtils.waitUntilClickable(profileHeader);
        profileHeader.click();
        waitUtils.waitUntilClickable(moreOptionsButton);
        moreOptionsButton.click();
        waitUtils.waitUntilClickable(emailButton);
        emailButton.click();
        log.info("Email sign-in opened");
        return new SignUpPopUpScreen(driver);
    }
}
