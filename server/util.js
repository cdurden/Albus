const api = require('./api');

api.getBoards(function(err, boards) {
    session = { passport: { user: "86258941::65ea761411d6325962ddba010329193a" } };
    //console.log(boards);
    for (board of boards) {
        if (board.task_id) {
            console.log("Submitting work on board "+board.boardId);
            data = { taskId: board.task_id, lti_user_id: board.user.lti_user_id, board_id: board.id }
            api.submit(session, data, function(err, res) {
                console.log(res)
            })
        }
    }
});
