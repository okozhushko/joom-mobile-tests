package mobile.screens;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.pagefactory.AndroidFindBy;
import io.appium.java_client.pagefactory.AppiumFieldDecorator;
import java.time.Duration;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import mobile.locators.LoginPageLocators;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.PageFactory;
import mobile.utils.WaitUtils;

@Slf4j
@Setter
public class ProfileScreen extends BaseScreen {
    private WaitUtils waitUtils;


    public ProfileScreen(AppiumDriver driver) {
        super(driver);
        PageFactory.initElements(new AppiumFieldDecorator(driver), this);
        this.waitUtils = new WaitUtils(driver);
    }

    public void verifyLoginScreenOpened(String loginTitle) {
        By selector = By.xpath("//android.widget.Button[@resource-id='com.joom:id/profile_header_name']");
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(3));
        wait.until(ExpectedConditions.visibilityOfElementLocated(selector));
        WebElement element = driver.findElement(selector);
        wait.until(ExpectedConditions.textToBePresentInElement(element, loginTitle));
    }

    @AndroidFindBy(xpath = LoginPageLocators.LOGIN_ACCOUNT_BUTTON_XPATH)
    private WebElement registrationButton;

    public ProfileScreen openRegistrationForm() {
        waitUtils.waitUntilClickable(registrationButton);
        registrationButton.click();
        log.info("Login profile: Opened");
        return this;
    }

    @AndroidFindBy(xpath = LoginPageLocators.MORE_OPTIONS_BUTTON_XPATH)
    private WebElement moreOptionsButton;

    public void showMoreOptions() {
        waitUtils.waitUntilClickable(moreOptionsButton);
        moreOptionsButton.click();
    }

    @AndroidFindBy(xpath = LoginPageLocators.EMAIL_BUTTON_XPATH)
    private WebElement signUpWithEmailButton;

    public SignUpPopUpScreen signUpWithEmail() {
        waitUtils.waitUntilInvisible(signUpWithEmailButton);
        showMoreOptions();

        waitUtils.waitUntilVisible(signUpWithEmailButton);
        signUpWithEmailButton.click();
        log.info("Sign up with Email: Accepted");
        return new SignUpPopUpScreen(driver);

    }
}
