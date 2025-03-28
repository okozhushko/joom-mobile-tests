package mobile.dto;


import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AddUserData {
    private  String userFirstName;
    private  String userLastName;
    private  String userEmail;
    private  String userPassword;
    private  String userPasswordConfirmation;

    public String getUserFirstName() {return userFirstName; }
    public  String getUserLastName() {
        return userLastName;
    }
    public  String getUserEmail() {
        return userEmail;
    }
    public  String getUserPassword() {
        return userPassword;
    }
    public  String getUserPasswordConfirmation() {
        return userPasswordConfirmation;
    }
}
