const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const localVariable = 123;
const remoteObject = {
  fieldA: "a",
  fieldB: 1,
  fieldC: /\d+/,
  someMethod: (value) => {
    return localVariable + value;
  },
  someMethodReturningAFunction: () => {
    return function (value) {
      return localVariable + value;
    };
  },
};

console.log("Context A");
io.on("connection", (socket) => {
  console.log("a user connected");
  console.log({ remoteObject, localVariable });
  io.emit("remoteObject", remoteObject);
  // Vanilla fields, A, B, C
  socket.on("vanillaField", (fieldName) => {
    let val = remoteObject[fieldName];
    // Convert RegExp to string ensure valid JSON
    const response = val instanceof RegExp ? val.toString() : val;
    socket.emit("vanillaFieldResponse", response);
  });
  // someMethod
  socket.on("functionField", ({ functionName, arg }) => {
    let response = remoteObject[functionName](arg);
    socket.emit("functionFieldResponse", response);
  });

  // someMethodReturningAFunction
  socket.on("higherOrderFunctionField", ({ functionName, arg }) => {
    let func = remoteObject[functionName];
    // Augment remote object with partially called function
    const partialCalledFunc = func(arg);
    remoteObject.partialCalledFunc = partialCalledFunc;
    let response = func();
    socket.emit("functionFieldResponse", response);
  });

  // call partiallyCalledFunctions
  socket.on("partialCalledFuncField", ({ functionName, arg }) => {
    let func = remoteObject[functionName];
    let response = func(arg);
    socket.emit("partialCalledFuncResponse", response);
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
