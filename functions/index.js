const functions=require("firebase-functions");
const admin=require("firebase-admin");
admin.initializeApp();
var firestore=admin.firestore();
exports.manageFlags=functions.firestore.document("studyguides/{id}").onUpdate((change,context)=>{
  const data=change.after.data();
  if (data.flags.length>4) {
    data.user.get().then(function(doc) {
      data.user.update({flags: doc.data().flags+1});
    });
    firestore.collection("trash").doc(change.after.id).set(data);
    return change.after.ref.delete();
  }
  return null;
});
exports.restore=functions.https.onRequest((req,res)=>{
  return admin.database().ref("password").once("value",snapshot=>{
    if (req.query.password===snapshot.val()) {
      firestore.collection("trash").doc(req.query.id).get().then(doc=>{
        firestore.collection("studyguides").doc(doc.id).set(doc.data());
        doc.ref.delete();
      }).catch(error=>{
        return res.status(400).send("An error occurred: "+error);
      });
      return res.status(200).send("Successfully restored study guide ID# "+req.query.id);
    }
    return res.status(401).send("Incorrect password.");
  });
});
;/*exports.setTimestamp=functions.firestore.document("studyguides/{id}").onCreate(event=>{
  var data=change.after.data();
  return data.user.get().then(function(doc) { data.user.update({lastAdd: new Date()}); });
});*/
/*exports.setFb=functions.firestore.document("feedback/{id}").onCreate(event=>{
  var data=change.after.data();
  return data.user.get().then(function(doc) { data.user.update({lastFb: new Date()}); });
});*/
exports.newUser=functions.firestore.document("users/{userId}").onCreate(event=>{
  return change.after.ref.update({
    flags: 0,
    //lastAdd: new Date("January 1, 2017 00:00:00"),
    lastFb: new Date("January 1, 2017 00:00:00"),
    settings: {}
  });
});
exports.manageUser=functions.https.onCall((data,context)=>{
  if (context.auth.uid!==null) {
    firestore.collection("users").doc(context.auth.uid).set({name: context.auth.token.name, email: context.auth.token.email});
  }
});
exports.addSG=functions.https.onCall((data,context)=>{
  if (!context.auth)
    throw new functions.https.HttpsError("unauthenticated","Not authenticated.");
  firestore.collection("users").doc(context.auth.uid).get().then(doc=>{
    const user=doc.data();
    if (user.flags>3)
      throw new functions.https.HttpsError("permission-denied","Must have three or less flags to add study guides","User has "+user.flags+" flags.");
    firestore.collection("courses").doc(data.course).collection("sg").add({
      title: data.title,
      description: data.description,
      url: data.url,
      time: new Date(),
      likes: [],
      flags: []
    })
  }).catch(error=>{

  });
});
exports.addFolder=functions.https.onCall((data,context)=>{

});