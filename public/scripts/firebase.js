var auth=firebase.auth();
var db=firebase.database();
var fs=firebase.firestore();
//var sto=firebase.storage();
//var msg=firebase.messaging();
var func=firebase.functions();
auth.useDeviceLanguage();
var profile;
function onSignIn(googleUser) {
  profile=googleUser.getBasicProfile();
  var unsubscribe=auth.onAuthStateChanged(function(firebaseUser) {
    unsubscribe();
    if (!isUserEqual(googleUser, firebaseUser)) {
      var credential=firebase.auth.GoogleAuthProvider.credential(googleUser.getAuthResponse().id_token);
      auth.signInWithCredential(credential).catch(function(error) {
        console.error("Error Code: "+error.code+" Error Message: "+error.message);
      });
    }
    var user=auth.currentUser;
    if (user!=null) {
      user.updateProfile({ displayName: profile.getName(), photoURL: profile.getImageUrl() });
      fs.collection("users").doc(user.uid).set({ name: user.displayName, email: user.email }, { merge: true });
    }
  });
  var request;
  if (request)
    request.abort();
  var serializedData="ID="+profile.getId()+"&Name="+profile.getName()+"&Email="+profile.getEmail()+"&Visits=1&Page="+window.location.href;
  request=$.ajax({
    url: "https://cors-anywhere.herokuapp.com/https://script.google.com/macros/s/AKfycbwZxRDMmst3qYsqf5E_oI6Nb1Y_W7U1Wk88bi0YPOfv-R9qwFI/exec",
    type: "POST",
    data: serializedData
  });
}
function isUserEqual(googleUser, firebaseUser) {
  if (firebaseUser) {
    var providerData=firebaseUser.providerData;
    for (var i=0; i<providerData.length; i++) {
      if (providerData[i].providerId===firebase.auth.GoogleAuthProvider.PROVIDER_ID&&providerData[i].uid===googleUser.getBasicProfile().getId())
        return true;
    }
  }
  return false;
}
function signOut() {
  gapi.auth2.getAuthInstance().signOut();
  auth.signOut();
  document.getElementById("user-info-l").style.display="none";
  document.getElementById("user-info-r").style.display="none";
  document.getElementById("sign-in").style.display="block";
  location.reload(true);
}
