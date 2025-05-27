const socketIo = (io) => {
  //store connectes useres with their room information using socket.id as their key
  const connectedUser = new Map();
  //handle new socket connections
  io.on("connection", (socket) => {
    //get user from authentication
    const user = socket.handshake.auth.user;
    console.log("User connected", user?.username);
    //!start:; join room handler
    socket.on("join room", (groupId) => {
      //add socket to specified room
      socket.join(groupId);
      //store user and room info in connectedUser map
      connectedUser.set(socket.id, { user, room: groupId });
      //get list of all users currently in the room
      const usersInRoom = Array.from(connectedUser.values())
        .filter((u) => u.room === groupId)
        .map((u) => u.user);
      //Emit updated users list to all client in the room
      io.in(groupId).emit("users in room", usersInRoom);
      //broadcast the joi notification to all other useres in the room
      socket.to(groupId).emit("notification", {
        type: "USER_JOINED",
        message: `${user?.username} has joined`,
        user: user,
      });
    });
    //!end:; join room handler

    //!start:; Leave room handler
    //triggered when user manually leaves a room
    socket.on("leave room", (groupId) => {
      console.log(`${user?.username} leaving room:`, groupId);
      //remove socket from the group
      socket.leave(groupId);
      if (connectedUser.has(socket.id)) {
        //remove user from connected users and notify other
        connectedUser.delete(socket.id);
        socket.to(groupId).emit("user left", user?._id);
      }
    });
    //!end:; Leave room handler

    //!start:; New message room handler
    socket.on("new message", (message) => {
      //broadcast message to all other users in the room
      socket.to(message.groupId).emit("message received", message);
    });
    //!end:; New message room handler

    //!start:; Disconnect room handler
    //triggered when user closes the connection
    socket.on("disconnect", () => {
      console.log(`${user?.username} disconnected`);
      if (connectedUser.has(socket.id)) {
        //get user's room info before removing
        const userData = connectedUser.get(socket.id);
        //notify other in the room about users depature
        socket.to(userData.room).emit("user left", user?._id);
        //ro=emove user from connected useres
        connectedUser.delete(socket.id);
      }
    });
    //!end:; Disconnect room handler

    //!start:; typing indicator room handler
    socket.on("typing", ({ groupId, username }) => {
      //broadcasr typing status to other users in group
      socket.to(groupId).emit("user typing", { username });
    });
    socket.on("stop typing", ({ groupId }) => {
      //broadcasr stop typing status to other users in group
      socket.to(groupId).emit("user stop typing", { username: user?.username });
    });
    //!end:; typing indicator room handler
  });
};

module.exports = socketIo;
