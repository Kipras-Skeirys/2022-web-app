import { io } from 'socket.io-client'

const socket = io(process.env.ENDPOINT)

socket.on("connect_error", (err) => {
    console.log(`[err] [socket.io] connect_error due to ${err.message}`)
})

export default socket