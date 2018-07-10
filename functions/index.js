const admin = require('firebase-admin');
const functions = require('firebase-functions');
const axios = require('axios');

const TRELLO_KEY = functions.config().trello.key;
const TRELLO_TOKEN = functions.config().trello.token;

admin.initializeApp();

exports.webhook = functions.https.onRequest((request, response) => {
  if (request.body.action) {
    if (request.body.action.type === 'createCard') {
      console.log('card created:', {
        card: request.body.action.data.card,
        board: request.body.action.data.board,
        list: request.body.action.data.list
      });
      return admin.firestore().collection('move_to_top').doc(request.body.action.data.board.id).get().then(doc => {
        if (doc.exists && Array.isArray(doc.data().lists) && doc.data().lists.indexOf(request.body.action.data.list.id) !== -1) {
          console.log('moving card to top');
          return axios.put(`https://api.trello.com/1/cards/${request.body.action.data.card.id}`, {
            key: TRELLO_KEY,
            token: TRELLO_TOKEN,
            pos: 'top'
          }).then((ar) => {
            console.log('axios response:', ar);
            response.send('Ok');
            return null;
          });
        } else {
          console.log("not a board or list we're tracking");
          response.send('Ok');
          return null;
        }
      });
    } else {
      console.log('ignoring action', request.body.action.type);
      response.send('Ok');
    }
  } else {
    console.log('ignoring unexpected request');
    response.send('Ok');
  }
});
