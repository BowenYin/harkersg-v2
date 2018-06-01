const functions=require("firebase-functions");
const admin=require("firebase-admin");
admin.initializeApp();
var firestore=admin.firestore();
exports.manageFlags=functions.firestore.document("studyguides/{id}").onUpdate((change, context)=>{
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
exports.restore=functions.https.onRequest((req, res)=>{
  return admin.database().ref("password").once("value", snapshot=>{
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
    settings: {},
  });
});
exports.manageUser=functions.https.onCall((data, context)=>{
  if (context.auth) {
    firestore.collection("users").doc(context.auth.uid).set({name: context.auth.token.name, email: context.auth.token.email});
  }
});
exports.addSG=functions.https.onCall((data, context)=>{
  try {
    if (!context.auth)
      throw new functions.https.HttpsError("unauthenticated", "Not authenticated.");
    if (!context.auth.token.email.match(/.+(?:@students\.|@staff\.|@)harker.org$/))
      throw new functions.https.HttpsError("permission-denied", "Must use a school email address.");
    if (data.honorCode!=true)
      throw new functions.https.HttpsError("failed-precondition", "Please accept the honor code.");
    if (typeof data.title!="string" || data.title.length<5 || data.title.length>50 ||
        typeof data.info!="string" || data.info.length>100 ||
        typeof data.url!="string" || data.url.indexOf("http")!=0 || data.url.length<18 || data.url.length>300 ||
        typeof data.showName!="boolean")
      throw new functions.https.HttpsError("invalid-argument", "Please check data again.");
    const userDoc=firestore.collection("users").doc(context.auth.uid);
    userDoc.get().then(doc=>{
      const user=doc.data();
      if (user.flags>3)
        throw new functions.https.HttpsError("permission-denied", "Must have 3 or fewer flags to add study guides.", "User has "+user.flags+" flags.");
      const courseDoc=firestore.collection("courses").doc(data.course);
      courseDoc.get().then(doc=>{
        if (!doc.exists)
          throw new functions.https.HttpsError("not-found", "Course not found.");
        if (data.folder!=null && !doc.data().folders.some(value=>{return value.title===data.folder;}))
          throw new functions.https.HttpsError("not-found", "Folder not found.");
        courseDoc.collection("sg").add({
          title: data.title,
          info: data.info,
          url: data.url,
          folder: data.folder,
          flags: [],
          marks: [],
          name: data.showName?context.auth.token.name||user.name:null,
          user: userDoc,
          time: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
    });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("unknown", "An unexpected error occurred.", error);
  }
});
exports.addFolder=functions.https.onCall((data, context)=>{
  try {
    if (!context.auth)
      throw new functions.https.HttpsError("unauthenticated", "Not authenticated.");
    if (!context.auth.token.email.match(/.+(?:@students\.|@staff\.|@)harker.org$/))
      throw new functions.https.HttpsError("permission-denied", "Must use a school email address.");
    firestore.collection("users").doc(context.auth.uid).get().then(doc=>{
      const user=doc.data();
      if (user.flags>0)
        throw new functions.https.HttpsError("permission-denied", "Must have zero flags to add folders.", "User has "+user.flags+" flags.");
      const courseRef=firestore.collection("courses").doc(data.course);
      var transaction=firestore.runTransaction(transaction=>{
        return transaction.get(courseRef).then(doc=>{
          if (!doc.exists)
            throw new functions.https.HttpsError("not-found", "Course not found.");
          let folders=doc.data().folders;
          folders.push({
            time: new Date(),
            title: data.title,
          });
          transaction.update(courseRef, {folders: folders});
          console.log('Folder "'+data.title+'" added to course '+data.course+' by '+context.auth.token.name+' (UID '+context.auth.uid+').');
        });
      });
    });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("unknown", "An unexpected error occurred.", error);
  }
});