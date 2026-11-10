package mobile.dto;

public record NewUser(String firstName, String lastName, String email, String password) {

    public String fullName() {
        return firstName + " " + lastName;
    }
}
