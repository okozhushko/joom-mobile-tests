package mobile.screens;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.pagefactory.AppiumFieldDecorator;
import org.slf4j.Logger;
import mobile.enums.LoginTitle;
import mobile.helper.Helper;
import org.openqa.selenium.support.PageFactory;
import org.slf4j.LoggerFactory;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

public class ProfileScreen extends BaseScreen {
    private static final Logger log = (Logger) LoggerFactory.getLogger(ProfileScreen.class);

    public ProfileScreen(AppiumDriver driver) {
        super(driver);
        PageFactory.initElements(new AppiumFieldDecorator(driver), this);
    }

    public void verifyLoginScreenOpened(LoginTitle loginTitle) {
        assertThat(Helper.isTextOnScreen(LoginTitle.LOGIN_TITLE.getValue()))
                .as("Check if the text '%s' is visible on the screen", loginTitle.getValue())
                .isTrue();

        log.info("Verified that '{}' text is visible", loginTitle.getValue());
    }
}
