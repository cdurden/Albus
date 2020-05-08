const api = require('./api');
var session = { passport: { user: "86258941::65ea761411d6325962ddba010329193a" } };
async function submitBoard(board) {
    if (board.task_id) {
        console.log("Submitting work on board "+board.boardId+" for user "+board.user.lti_user_id);
        data = { taskId: board.task_id, lti_user_id: board.user.lti_user_id, board_id: board.id }
        session.actingAsUser = board.user.lti_user_id;
        //console.log(session.actingAsUser);
        api.submit(session, data, function(err, res) {
            console.log(res)
            resolveBoard(res);
        })
    }
}

async function submitBoards() {
    return new Promise(resolve => {
        api.getBoards(function(err, boards) {
            //console.log(boards);
            for (board of boards) {
                await submitBoard(board);
            }
        });
    });
}
submitBoards().then(process.exit);
