package tests.account;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import mobile.dto.NewUser;
import mobile.screens.JoomHomeScreen;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.BaseTest;

class RegistrationUserTest extends BaseTest {

    @Test
    @Tag("acceptanceTest")
    @DisplayName("New user registers by email and sees their name on the profile screen")
    void registerNewUserByEmail() {
        NewUser user = uniqueUser();

        String header = new JoomHomeScreen(driver)
                .completeOnboarding()
                .openProfile()
                .openEmailSignIn()
                .register(user)
                .waitForHeaderText(user.fullName());

        assertThat(header).as("Profile header after registration").isEqualTo(user.fullName());
    }

    /** A unique email per run, so reruns never hit "email already registered". */
    private static NewUser uniqueUser() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        return new NewUser("John", "Dee", "autotest." + suffix + "@test.com", "AaBbCc77");
    }
}
