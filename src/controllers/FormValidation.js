exports.isPasswordInvalid = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    const isTooShort = password.length < minLength;
    const isInvalid = !hasUpperCase || !hasLowerCase || !hasNumbers || isTooShort;
  
    return isInvalid;
}

exports.isEmailInvalid = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailPattern.test(email);
}