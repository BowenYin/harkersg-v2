const functions=require("firebase-functions");
const admin=require("firebase-admin");
admin.initializeApp();
exports.manageFlags=functions.firestore.document("studyguides/{id}").onUpdate((change,context)=>{
  var data=change.after.data();
  if (data.flags.length>4) {
    data.user.get().then(function(doc) { data.user.update({flags: doc.data().flags+1}); });
    admin.firestore().collection("trash").doc(change.after.id).set(data);
    return change.after.ref.delete();
  }
  return null;
});
exports.restore=functions.https.onRequest((req,res)=>{
  if (req.query.password=="codingftw") {
    var id=req.query.id;
    admin.firestore().collection("trash").doc(id).get().then(doc=>{
      admin.firestore().collection("studyguides").doc(doc.id).set(doc.data());
      doc.ref.delete();
    });
    res.status(200).send("Success.");
  } else
    res.status(200).send("Incorrect password.");
});
exports.setTimestamp=functions.firestore.document("studyguides/{id}").onCreate(event=>{
  var data=change.after.data();
  return data.user.get().then(function(doc) { data.user.update({lastAdd: new Date()}); });
});
exports.setFb=functions.firestore.document("feedback/{id}").onCreate(event=>{
  var data=change.after.data();
  return data.user.get().then(function(doc) { data.user.update({lastFb: new Date()}); });
});
exports.newUser=functions.firestore.document("users/{userId}").onCreate(event=>{
  return change.after.ref.update({
    flags: 0,
    lastAdd: new Date("January 1, 2017 00:00:00"),
    lastFb: new Date("January 1, 2017 00:00:00"),
    settings: {}
  });
});