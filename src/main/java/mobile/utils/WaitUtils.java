package mobile.utils;

import java.time.Duration;
import mobile.config.Config;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class WaitUtils {
    private final WebDriver driver;
    private final WebDriverWait wait;

    public WaitUtils(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(Config.getInt("wait.timeout.seconds")));
    }

    public void waitUntilClickable(WebElement element) {
        wait.until(ExpectedConditions.elementToBeClickable(element));
    }

    public void waitUntilVisible(WebElement element) {
        wait.until(ExpectedConditions.visibilityOf(element));
    }

    /** For optional UI such as popups: returns false instead of failing when the element never shows up. */
    public boolean isVisibleWithin(WebElement element, Duration timeout) {
        try {
            new WebDriverWait(driver, timeout).until(ExpectedConditions.visibilityOf(element));
            return true;
        } catch (TimeoutException e) {
            return false;
        }
    }

    /**
     * Waits for the element's text to contain {@code expected}. A timeout is not an error here: the caller
     * reads the text afterwards and its assertion reports the actual value.
     */
    public void waitForText(WebElement element, String expected) {
        try {
            wait.until(ExpectedConditions.textToBePresentInElement(element, expected));
        } catch (TimeoutException e) {
            // Deliberately ignored, see the method comment.
        }
    }
}
