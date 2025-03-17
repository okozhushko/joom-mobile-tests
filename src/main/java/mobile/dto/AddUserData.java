package mobile.dto;


import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AddUserData {

    private String userFirstName;
    private String userLastName;
    private String userEmail;
    private String userPassword;
    private String userPasswordConfirmation;

}
