package tests.account;

import mobile.helper.TestDescription;
import mobile.screens.JoomHomeScreen;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tests.BaseTest;

public class GetProfileScreenTest extends BaseTest {
    @Test
    @DisplayName("Open Login screen")
    @TestDescription("Close advertisement, enable notifications, confirmation")
    public void testGetLoginScreen() {
        JoomHomeScreen joomHomeScreen = new JoomHomeScreen(driver);
        joomHomeScreen
                .closeAdvertisement()
                .clickEnableButton()
                .clickAllowButton()
                .clickSpinTheWheel()
                .backHomeButton()
                .clickProfileButton()
                .verifyLoginScreenOpened("Log in");
    }
}
