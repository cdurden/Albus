const api = require('./api');

function submitBoards() {
    return new Promise(resolve => {
        api.getBoards(function(err, boards) {
            session = { passport: { user: "86258941::65ea761411d6325962ddba010329193a" } };
            //console.log(boards);
            Promise.all(boards.map(board => {
                return new Promise(resolveBoard => {
                    //console.log(board.task_id);
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
                });
            })).then(resolve(boards));
        });
    });
}
submitBoards().then(process.exit);
