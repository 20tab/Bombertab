import uwsgi
import gevent.select
import redis

class TremoloApp():

    def send(self, msg):
        uwsgi.websocket_send(msg)

    def broadcast(self, msg):
         self.r.publish('foobar', msg)

    def __init__(self, inactivity_timeout=60):
        self.inactivity_timeout = inactivity_timeout

    def setup(self, core_id):
        pass

    def __call__(self, environ, start_response):
        uwsgi.websocket_handshake(environ['HTTP_SEC_WEBSOCKET_KEY'], environ.get('HTTP_ORIGIN', ''))
        print "websockets..."
        self.r = redis.StrictRedis(host='127.0.0.30', port=19759, db=0)
        channel = self.r.pubsub()
        channel.subscribe('foobar')

        websocket_fd = uwsgi.connection_fd()
        redis_fd = channel.connection._sock.fileno()

        core_id = environ['uwsgi.core']
        self.setup(core_id)

        while True:
            ready = gevent.select.select([websocket_fd, redis_fd], [], [], 4.0)
            if not ready[0]:
                uwsgi.websocket_recv_nb()
            for fd in ready[0]:
                if fd == websocket_fd:
                    try:
                        msg = uwsgi.websocket_recv_nb()
                    except IOError:
                        self.end(core_id)
                        return ""
                    if msg:
                        self.websocket(core_id, msg)
                elif fd == redis_fd:
                    msg = channel.parse_response()
                    if msg[0] == 'message':
                        uwsgi.websocket_send(msg[2])
            
