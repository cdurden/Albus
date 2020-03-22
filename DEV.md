1. How to submit work:
  a. client emits "submit"
  b. server gets the client data and copies the room
  c. server adds a submission to the stack
2. How to assign a room
  a. assign method is called on the server
  b. server sets the roomId key of the socket hash in redis
  c. **how do we make sure the roomId stored in redis is bound to socket.room? Do we need socket.room?**
  c. server emits "assign" with the room id
3. How to prevent a socket from writing to a room that is not assigned to the socket.
  a. modify the server's socket.on('roomId') so that the server sets the roomId if it is not already set
  b. 
3. How to add an image
