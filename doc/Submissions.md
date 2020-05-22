# Submissions

Submissions represent data that a student has submitted to the (server which processes and maintains student data) to demonstrate completion of a task. A submission has the following components:
* a task
* a user
* a timestamp

A submission may contain the following components:

* additional data that the task enables the user to provide
* a board
* a grade
* a recipient (the user to whom the submission is provided for purposes of providing feedback)

Submissions are also linked to

* feedback

## Designating recipients for submissions
The methods for designating recipients of submissions are essential to how the system aims to support a cooperative learning environment.

## Grading and providing feedback about submissions
A user can view received submissions through the submissions route. This route retrieves submissions from the (server which processes and maintains student data) and loads the boards into the boards array in the whiteboard client. When it loads the boards it sets the board's submission property to refer back to itself. When viewing a board which contains a submission object, the whiteboard client application will enable a feedback panel through which a user can provide feedback about a submission. **FIXME: this section is not currently accurate. Submissions are transformed into a list of boards by the whiteboard server before they are passed to the client, and the submission object is not set on boards. An advantage of processing submissions on the client side, as described here, is that it would allow different collections of boards to display more quickly when the user transitions between routes, e.g. from viewing the boards associated with an assignment to viewing boards associated with submissions. This would, however, require that these collections of boards be maintained separately (or processed via filters) by the client.**

### Grading submissions

