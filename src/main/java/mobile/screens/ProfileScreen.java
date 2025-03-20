package mobile.screens;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.pagefactory.AppiumFieldDecorator;
import java.time.Duration;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.slf4j.Logger;
import org.openqa.selenium.support.PageFactory;
import org.slf4j.LoggerFactory;
import mobile.utils.WaitUtils;


public class ProfileScreen extends BaseScreen {
    private static final Logger log = (Logger) LoggerFactory.getLogger(ProfileScreen.class);
    private WaitUtils waitUtils;


    public ProfileScreen(AppiumDriver driver) {
        super(driver);
        PageFactory.initElements(new AppiumFieldDecorator(driver), this);
    }

    public void verifyLoginScreenOpened(String loginTitle) {
        By selector = By.xpath("//android.widget.Button[@resource-id='com.joom:id/profile_header_name']");
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(3));
        wait.until(ExpectedConditions.visibilityOfElementLocated(selector));
        WebElement element = driver.findElement(selector);
        wait.until(ExpectedConditions.textToBePresentInElement(element, loginTitle));
    }
}
