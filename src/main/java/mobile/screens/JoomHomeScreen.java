package mobile.screens;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.pagefactory.AndroidFindBy;
import io.appium.java_client.pagefactory.AppiumFieldDecorator;
import java.time.Duration;
import java.util.NoSuchElementException;
import org.openqa.selenium.TimeoutException;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import mobile.locators.JoomHomePageLocators;
import mobile.utils.WaitUtils;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

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
        try {
            WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
            wait.until(ExpectedConditions.elementToBeClickable(spinWheelButton));

            if (spinWheelButton.isDisplayed()) {
                spinWheelButton.click();
                log.info("Spin button: clicked");
            }
        } catch (TimeoutException | NoSuchElementException e) {
            log.info("Spin button not present, skipping");
        }
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

    @AndroidFindBy(xpath = JoomHomePageLocators.ACCEPT_ALL_BTN)
    private WebElement acceptAllButton;

    public JoomHomeScreen handleCookiesPopupIfAny() {
        try {
            if (acceptAllButton.isDisplayed()) {
                acceptAllButton.click();
                log.info("Accepted cookies");
            }
        } catch (Exception e) {
            log.debug("No cookies popup, moving on");
        }
        return new JoomHomeScreen(driver);
    }
}