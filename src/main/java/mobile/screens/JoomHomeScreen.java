package mobile.screens;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.pagefactory.AndroidFindBy;
import java.time.Duration;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import mobile.locators.JoomHomePageLocators;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.PointerInput;
import org.openqa.selenium.interactions.Sequence;

@Slf4j
public class JoomHomeScreen extends BaseScreen {
    // How long to wait for promos and banners that appear on some launches only, before treating them as absent.
    private static final Duration OPTIONAL_POPUP_TIMEOUT = Duration.ofSeconds(5);

    // The launch ad's close button has no known locator yet, so it is tapped by coordinate after the ad renders.
    // Both values are specific to the device the test was written on; replace with a locator from Appium Inspector.
    private static final Duration AD_RENDER_DELAY = Duration.ofSeconds(4);
    private static final int AD_CLOSE_X = 989;
    private static final int AD_CLOSE_Y = 186;

    @AndroidFindBy(xpath = JoomHomePageLocators.ENABLE_NOTIFICATIONS_BTN)
    private WebElement enableNotificationsButton;

    @AndroidFindBy(xpath = JoomHomePageLocators.ALLOW_NOTIFICATIONS_BTN)
    private WebElement allowNotificationsButton;

    @AndroidFindBy(xpath = JoomHomePageLocators.SPIN_WHEEL_BTN)
    private WebElement spinWheelButton;

    @AndroidFindBy(xpath = JoomHomePageLocators.BACK_HOME_SCREEN_BTN)
    private WebElement backHomeButton;

    @AndroidFindBy(xpath = JoomHomePageLocators.ACCEPT_ALL_BTN)
    private WebElement acceptAllButton;

    @AndroidFindBy(xpath = JoomHomePageLocators.PROFILE_BTN)
    private WebElement profileButton;

    public JoomHomeScreen(AppiumDriver driver) {
        super(driver);
    }

    /** Gets a freshly launched app past the ad, notification prompts, spin-the-wheel promo and cookie banner. */
    public JoomHomeScreen completeOnboarding() {
        closeAdvertisement();
        enableNotifications();
        spinTheWheelIfShown();
        clickBackHome();
        acceptCookiesIfShown();
        return this;
    }

    public ProfileScreen openProfile() {
        waitUtils.waitUntilClickable(profileButton);
        profileButton.click();
        log.info("Profile opened");
        return new ProfileScreen(driver);
    }

    private void closeAdvertisement() {
        try {
            Thread.sleep(AD_RENDER_DELAY);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for the launch ad", e);
        }
        PointerInput finger = new PointerInput(PointerInput.Kind.TOUCH, "finger");
        Sequence tap = new Sequence(finger, 1)
                .addAction(finger.createPointerMove(Duration.ZERO, PointerInput.Origin.viewport(), AD_CLOSE_X, AD_CLOSE_Y))
                .addAction(finger.createPointerDown(PointerInput.MouseButton.LEFT.asArg()))
                .addAction(finger.createPointerUp(PointerInput.MouseButton.LEFT.asArg()));
        driver.perform(List.of(tap));
        log.info("Advertisement closed");
    }

    private void enableNotifications() {
        waitUtils.waitUntilClickable(enableNotificationsButton);
        enableNotificationsButton.click();
        waitUtils.waitUntilClickable(allowNotificationsButton);
        allowNotificationsButton.click();
        log.info("Notifications enabled");
    }

    private void spinTheWheelIfShown() {
        if (waitUtils.isVisibleWithin(spinWheelButton, OPTIONAL_POPUP_TIMEOUT)) {
            spinWheelButton.click();
            log.info("Spin the wheel: clicked");
        } else {
            log.info("Spin the wheel not shown, skipping");
        }
    }

    private void clickBackHome() {
        waitUtils.waitUntilClickable(backHomeButton);
        backHomeButton.click();
        log.info("Back home: clicked");
    }

    private void acceptCookiesIfShown() {
        if (waitUtils.isVisibleWithin(acceptAllButton, OPTIONAL_POPUP_TIMEOUT)) {
            acceptAllButton.click();
            log.info("Cookies accepted");
        } else {
            log.info("No cookies banner, skipping");
        }
    }
}
