const auth=firebase.auth();
const db=firebase.database();
const fs=firebase.firestore();
//const sto=firebase.storage();
//const msg=firebase.messaging();
const functions=firebase.functions();
auth.useDeviceLanguage();
function signIn() {
  var provider=new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(function(error) {
    console.error(error);
  });
}
function signOut() {
  auth.signOut();
  document.getElementById("user-info-l").style.display="none";
  document.getElementById("user-info-r").style.display="none";
  document.getElementById("sign-in").style.display="block";
  location.reload(true);
}