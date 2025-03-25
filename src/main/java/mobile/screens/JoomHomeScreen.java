package mobile.screens;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.pagefactory.AndroidFindBy;
import io.appium.java_client.pagefactory.AppiumFieldDecorator;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import mobile.locators.JoomHomePageLocators;
import mobile.utils.WaitUtils;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;

@Slf4j
@Setter
public class JoomHomeScreen extends BaseScreen {
    private WaitUtils waitUtils;

    public JoomHomeScreen(AppiumDriver driver) {
        super(driver);
        PageFactory.initElements(new AppiumFieldDecorator(driver), this);
        this.waitUtils = new WaitUtils(driver);
    }

    public JoomHomeScreen closeAdvertisement() {
        int xCoordinate = 989;
        int yCoordinate = 186;

        tapByCoordinate(xCoordinate, yCoordinate);
        log.info("Advertisement closed");
        return new JoomHomeScreen(driver);
    }

    @AndroidFindBy(xpath = JoomHomePageLocators.ENABLE_NOTIFICATIONS_BTN)
    private WebElement enableNotificationsButton;

    public JoomHomeScreen clickEnableButton() {
        waitUtils.waitUntilClickable(enableNotificationsButton);
        enableNotificationsButton.click();
        log.info("Enable button: clicked");
        return new JoomHomeScreen(driver);
    }

    @AndroidFindBy(xpath = JoomHomePageLocators.ALLOW_NOTIFICATIONS_BTN)
    private WebElement allowNotificationsButton;

    public JoomHomeScreen clickAllowButton() {
        waitUtils.waitUntilClickable(allowNotificationsButton);
        allowNotificationsButton.click();
        log.info("Allow button: clicked");
        return new JoomHomeScreen(driver);
    }

    @AndroidFindBy(xpath = JoomHomePageLocators.SPIN_WHEEL_BTN)
    private WebElement spinWheelButton;

    public JoomHomeScreen clickSpinTheWheel() {
        waitUtils.waitUntilClickable(spinWheelButton);
        spinWheelButton.click();
        log.info("Spin button: clicked");
        return new JoomHomeScreen(driver);
    }

    @AndroidFindBy(xpath = JoomHomePageLocators.BACK_HOME_SCREEN_BTN)
    private WebElement backHomeButton;

    public JoomHomeScreen backHomeButton() {
        waitUtils.waitUntilClickable(backHomeButton);
        backHomeButton.click();
        log.info("Back home button: clicked");
        return new JoomHomeScreen(driver);
    }

    @AndroidFindBy(xpath = JoomHomePageLocators.PROFILE_BTN)
    private WebElement profileButton;

    public ProfileScreen clickProfileButton() {
        waitUtils.waitUntilClickable(profileButton);
        profileButton.click();
        log.info("profile button: clicked");
        return new ProfileScreen(driver);
    }
}