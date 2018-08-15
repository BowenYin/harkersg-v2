const functions=require("firebase-functions");
const admin=require("firebase-admin");
admin.initializeApp();
var firestore=admin.firestore();
exports.createUser=functions.auth.user().onCreate((user, context)=>{
  return firestore.collection("users").doc(user.uid).set({
    name: user.displayName,
    courses: [],
    locked: false,
  });
});
exports.manageFlags=functions.firestore.document("studyguides/{id}").onUpdate((change, context)=>{
  var data=change.after.data();
  if (data.flags.length>3) {
    data.ref=change.after.ref;
    firestore.collection("trash").doc(change.after.id).set(data);
    console.log("Study guide ID#"+change.after.id+" deleted from "+change.after.ref.parent.parent.id+".");
    return change.after.ref.delete();
  } return;
});
exports.restore=functions.https.onRequest((req, res)=>{
  return admin.database().ref("password").once("value", snapshot=>{
    if (req.query.password!==snapshot.val()) return res.status(401).send("Incorrect password.");
    return firestore.collection("trash").doc(req.query.id).get().then(doc=>{
      var data=doc.data();
      var ref=data.ref;
      delete data.ref;
      ref.set(data);
      return doc.ref.delete().then(()=>{
        return res.status(200).send("Successfully restored study guide ID#"+req.query.id);
      });
    }).catch(error=>{return res.status(400).send("An unexpected error has occurred: "+error);});
  });
});
exports.updateUser=functions.https.onCall((data, context)=>{
  if (!context.auth)
    throw new functions.https.HttpsError("unauthenticated");
  firestore.collection("users").doc(context.auth.uid).update({name: context.auth.token.name});
});
exports.sendFeedback=functions.https.onCall((data, context)=>{
  if (!context.auth)
    throw new functions.https.HttpsError("unauthenticated");
  if (["comment", "feature", "bug", "mistake"].indexOf(data.type)==-1 ||
      typeof data.text!="string" || data.text.length<10 || data.text.length>500 ||
      typeof data.rating!="number" || data.rating<1 || data.rating>10)
    throw new functions.https.HttpsError("invalid-argument");
  return firestore.collection("feedback").add({
    name: context.auth.token.name,
    user: firestore.collection("users").doc(context.auth.uid),
    type: data.type,
    text: data.text,
    rating: data.rating,
    time: admin.firestore.FieldValue.serverTimestamp(),
  }).then(()=>{console.log("New feedback in HarkerSG");})
  .catch(error=>{throw new functions.https.HttpsError("unknown", error);});
});
exports.updateCourses=functions.https.onCall((data, context)=>{
  if (!context.auth)
    throw new functions.https.HttpsError("unauthenticated");
  if (!context.auth.token.email.match(/.+(?:@students\.|@staff\.|@)harker.org$/))
    throw new functions.https.HttpsError("permission-denied");
  if (data.courses.constructor!==Array || data.courses.length>7)
    throw new functions.https.HttpsError("invalid-argument");
  return firestore.collection("users").doc(context.auth.uid).update({
    courses: data.courses,
  }).catch(error=>{throw new functions.https.HttpsError("unknown", error);});
});
exports.addSG=functions.https.onCall((data, context)=>{
  if (!context.auth)
    throw new functions.https.HttpsError("unauthenticated");
  if (!context.auth.token.email.match(/.+(?:@students\.|@staff\.|@)harker.org$/))
    throw new functions.https.HttpsError("permission-denied");
  if (data.honorCode!=true)
    throw new functions.https.HttpsError("failed-precondition");
  if (typeof data.title!="string" || data.title.length<5 || data.title.length>50 ||
      typeof data.info!="string" || data.info.length>100 ||
      typeof data.url!="string" || data.url.indexOf("http")!=0 || data.url.length<18 || data.url.length>250 ||
      typeof data.showName!="boolean")
    throw new functions.https.HttpsError("invalid-argument");
  const userDoc=firestore.collection("users").doc(context.auth.uid);
  return userDoc.get().then(doc=>{
    const user=doc.data();
    if (user.locked)
      throw new functions.https.HttpsError("permission-denied");
    const courseDoc=firestore.collection("courses").doc(data.course);
    return courseDoc.get().then(doc=>{
      if (data.folder!=null && !doc.data().folders.some(value=>{return value.time===data.folder;}))
        throw new functions.https.HttpsError("not-found");
      return courseDoc.collection("sg").add({
        title: data.title,
        info: data.info,
        url: data.url,
        folder: data.folder,
        likes: [],
        flags: [],
        name: data.showName?context.auth.token.name||user.name:"Anonymous",
        user: userDoc,
        time: admin.firestore.FieldValue.serverTimestamp(),
      });
    }).catch(error=>{throw error;});
  });
});
exports.editSG=functions.https.onCall((data, context)=>{
  if (!context.auth)
    throw new functions.https.HttpsError("unauthenticated");
  if (!context.auth.token.email.match(/.+(?:@students\.|@staff\.|@)harker.org$/))
    throw new functions.https.HttpsError("permission-denied");
  if (typeof data.title!="string" || data.title.length<5 || data.title.length>50 ||
      typeof data.info!="string" || data.info.length>100)
    throw new functions.https.HttpsError("invalid-argument");
  return firestore.collection("users").doc(context.auth.uid).get().then(doc=>{
    if (doc.data().locked)
      throw new functions.https.HttpsError("permission-denied");
    return firestore.collection("courses").doc(data.course).collection("sg").doc(data.id).update({
      title: data.title,
      info: data.info,
    }).then(()=>{
      console.log("Study guide ID#"+data.id+" edited in "+data.course+" by "+context.auth.token.name+" (UID "+context.auth.uid+").");
    }).catch(error=>{throw error;});
  });
});
exports.likeSG=functions.https.onCall((data, context)=>{
  if (!context.auth)
    throw new functions.https.HttpsError("unauthenticated");
  if (!context.auth.token.email.match(/.+(?:@students\.|@staff\.|@)harker.org$/))
    throw new functions.https.HttpsError("permission-denied");
  return firestore.collection("users").doc(context.auth.uid).get().then(doc=>{
    if (doc.data().locked)
      throw new functions.https.HttpsError("permission-denied");
    const docRef=firestore.collection("courses").doc(data.course).collection("sg").doc(data.id);
    return firestore.runTransaction(transaction=>{
      return transaction.get(docRef).then(doc=>{
        let likes=doc.data().likes;
        if (likes.indexOf(context.auth.uid)!=-1)
          throw new functions.https.HttpsError("already-exists");
        likes.push(context.auth.uid);
        transaction.update(docRef, {likes: likes});
      });
    }).catch(error=>{throw error;});
  });
});
exports.flagSG=functions.https.onCall((data, context)=>{
  if (!context.auth)
      throw new functions.https.HttpsError("unauthenticated");
  if (!context.auth.token.email.match(/.+(?:@students\.|@staff\.|@)harker.org$/))
    throw new functions.https.HttpsError("permission-denied");
  return firestore.collection("users").doc(context.auth.uid).get().then(doc=>{
    if (doc.data().locked)
      throw new functions.https.HttpsError("permission-denied");
    const docRef=firestore.collection("courses").doc(data.course).collection("sg").doc(data.id);
    return firestore.runTransaction(transaction=>{
      return transaction.get(docRef).then(doc=>{
        let flags=doc.data().flags;
        if (flags.indexOf(context.auth.uid)!=-1)
          throw new functions.https.HttpsError("already-exists");
        flags.push(context.auth.uid);
        transaction.update(docRef, {flags: flags});
      });
    }).then(()=>{
      console.log("Study guide ID#"+data.id+ " in "+data.course+" flagged by "+context.auth.token.name+" (UID "+context.auth.uid+").");
    }).catch(error=>{throw error;});
  });
});
exports.addFolder=functions.https.onCall((data, context)=>{
  if (!context.auth)
    throw new functions.https.HttpsError("unauthenticated");
  if (!context.auth.token.email.match(/.+(?:@students\.|@staff\.|@)harker.org$/))
    throw new functions.https.HttpsError("permission-denied");
  if (typeof data.title!="string" || data.title.length<4 || data.title.length>40)
    throw new functions.https.HttpsError("invalid-argument");
  return firestore.collection("users").doc(context.auth.uid).get().then(doc=>{
    if (doc.data().locked)
      throw new functions.https.HttpsError("permission-denied");
    var now;
    const courseRef=firestore.collection("courses").doc(data.course);
    return firestore.runTransaction(transaction=>{
      return transaction.get(courseRef).then(doc=>{
        let folders=doc.data().folders;
        now=new Date().getTime();
        folders.push({
          time: now,
          title: data.title,
        });
        transaction.update(courseRef, {folders: folders});
      });
    }).then(()=>{
      console.log('Folder ID#'+now+' added to '+data.course+' by '+context.auth.token.name+' (UID '+context.auth.uid+').');
    }).catch(error=>{throw error;});
  });
});
exports.editFolder=functions.https.onCall((data, context)=>{
  if (!context.auth)
    throw new functions.https.HttpsError("unauthenticated");
  if (!context.auth.token.email.match(/.+(?:@students\.|@staff\.|@)harker.org$/))
    throw new functions.https.HttpsError("permission-denied");
  if (typeof data.title!="string" || data.title.length<4 || data.title.length>40)
    throw new functions.https.HttpsError("invalid-argument");
  return firestore.collection("users").doc(context.auth.uid).get().then(doc=>{
    if (doc.data().locked)
      throw new functions.https.HttpsError("permission-denied");
    const courseRef=firestore.collection("courses").doc(data.course);
    return firestore.runTransaction(transaction=>{
      return transaction.get(courseRef).then(doc=>{
        let folders=doc.data().folders;
        let index=folders.findIndex(value=>{return value.time===data.folder;});
        folders[index].title=data.title;
        transaction.update(courseRef, {folders: folders});
      });
    }).then(()=>{
      console.log('Folder ID#'+data.folder+' edited in '+data.course+' by '+context.auth.token.name+' (UID '+context.auth.uid+').');
    }).catch(error=>{throw error;});
  });
});