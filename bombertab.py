from tremolo import TremoloApp
import simplejson as json
import gevent

"""
def bomb_explodes(self, bomb):
    for i in range(1, bomb.power+1):
        cross_north = bomb.pos - (self.map_width*i)
        cross_south = bomb.pos + (self.map_width*i)
        cross_east = bomb.pos + i
        cross_west = bomb.pos - i
        for player in self.players:
            if player.pos in [bomb.pos, cross_north, cross_south, cross_east, cross_west]:
                kill_player(player)
"""

bomber_arena = [
   1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
   1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
   1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,
   1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
   1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,
   1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
   1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,
   1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
   1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,
   1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
   1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
]

def bomb_task(bomber):
    gevent.sleep(3)
    print "EXPLODE !!!!"
    bomb = {'c':'x', 'p':bomber.id}
    for player in bomber.game.players:
        p = bomber.game.players[player]
        p.session.send('websocket', json.dumps(bomb))
    bomber.dropped = False

class BomberPlayer():

    def __init__(self, game, session):
        self.id = game.pc
        self.game = game
        self.pos = 0
        self.direction = 's'
        self.old_direction = 's'
        self.w = 50
        self.h = 70
        self.x = 50
        self.y = 50+self.game.arena_block - self.h
        self.dropped = False
        self.speed = 7
        self.session = session

    def collision(self, x1, y1, w1, h1, x2, y2, w2, h2):
        if (y1 + h1) < y2: return 0
        if y1 > (y2 + h2): return 0
	if (x1 + w1) < x2: return 0
        if x1 > (x2+w2): return 0
        return 1

    def drop_bomb(self):
        if self.dropped: return 
        self.dropped = True
        y = (self.y+20)/self.game.arena_block
        if (self.y+20)%self.game.arena_block > 0:
            y += 1
        y = y * self.game.arena_block_w
        x = (self.x/self.game.arena_block)
        if (self.x%self.game.arena_block) > 0:
            x += 1
        pos = y+x
        print pos
	x2 = (pos%self.game.arena_block_w) * 50
        y2 = (pos/self.game.arena_block_w) * 50
	bomb = {'c':'b', 'p':self.id, 'x':x2, 'y':y2}
        gevent.spawn(bomb_task, self)
        for player in self.game.players:
            p = self.game.players[player]
            p.session.send('websocket', json.dumps(bomb))
        

    def move_north(self):
        self.old_direction = self.direction
        self.direction = 'n'
        coll = self.collide(self.x, (self.y+20)-self.speed)
        if not coll:
            self.y -= self.speed
            self.redraw()
        else:
            coll_x = (coll%self.game.arena_block_w)*50
            feet_x = self.x
            if feet_x > coll_x+25:
                self.move_east()
            else:
                self.move_west()

    def move_south(self):
        self.old_direction = self.direction
        self.direction = 's'
        coll = self.collide(self.x, (self.y+20)+self.speed)
        if not coll:
            self.y += self.speed
            self.redraw()
        else:
            coll_x = (coll%self.game.arena_block_w)*50
            feet_x = self.x
            if feet_x > coll_x+25:
                self.move_east()
            else:
                self.move_west()

    def collide(self, x, y):
        for i in range(0, len(self.game.arena)):
            x2 = (i%self.game.arena_block_w) * 50
            y2 = (i/self.game.arena_block_w) * 50
            if self.game.arena[i] != 0 and self.collision(x+5,y+5, 40, 40, x2, y2, 50, 50):
                return i
        return None

    def move_east(self):
        self.old_direction = self.direction
        self.direction = 'e'
        coll = self.collide(self.x+self.speed, self.y+20)
        if not coll:
            self.x += self.speed
            self.redraw()
        else:
            coll_y = (coll/self.game.arena_block_w)*50
            feet_y = self.y+self.h
            if feet_y > coll_y+25:
                self.move_south()
            else:
                self.move_north()

    def move_west(self):
        self.old_direction = self.direction
        self.direction = 'w'
        coll = self.collide(self.x-self.speed, self.y+20)
        if not coll:
            self.x -= self.speed
            self.redraw()
        else:
            coll_y = (coll/self.game.arena_block_w)*50
            feet_y = self.y+self.h
            if feet_y > coll_y+25:
                self.move_south()
            else:
                self.move_north()

    def redraw(self):
        msg = {'c':'m', 'p':self.id, 'x':self.x, 'y':self.y, 'd':self.direction, 'o':self.old_direction}
        for player in self.game.players:
            #print player
            p = self.game.players[player]
            p.session.send('websocket', json.dumps(msg))

class BomberTab(TremoloApp):

    players = {}
    arena = bomber_arena
    pc = 0
    arena_block = 50
    arena_block_w = 19
    arena_block_h = 11
    arena_w = arena_block_w * arena_block
    arena_h = arena_block_h * arena_block

    def end(self, session):
        try:
            print "il giocatore %d si e' disconnesso" % session.player.id
            for p in self.players:
                enemy = self.players[p]
                announce = {'c':'k', 'p':session.player.id}
                print json.dumps(announce)
                enemy.session.send('websocket', json.dumps(announce))
            del(self.players[session.player.id]) 
        except:
            pass

    def websocket(self, session, js):
        msg = json.loads(js) 
        if msg['c'] == 'j':
            self.pc += 1
            bp = BomberPlayer(self, session)
            session.player = bp
            lista_giocatori = []
            for player in self.players:
                ep = self.players[player]
                lista_giocatori.append([ep.id, ep.x, ep.y])
            response = {'c': 'z', 'p':bp.id, 'a': self.arena, 'e': lista_giocatori, 'x':bp.x, 'y':bp.y}
            session.send('websocket', json.dumps(response))
            for p in self.players:
                enemy = self.players[p]
                announce = {'c':'p', 'p':bp.id, 'x':bp.x, 'y':bp.y}
                print "ANNOUNCE", json.dumps(announce)
                enemy.session.send('websocket', json.dumps(announce))
            self.players[self.pc] = bp
            print "new player", self.pc
            return
        elif msg['c'] == 'n':
            bp = self.players[msg['p']] 
            bp.move_north()
        elif msg['c'] == 's':
            bp = self.players[msg['p']] 
            bp.move_south()
        elif msg['c'] == 'e':
            bp = self.players[msg['p']] 
            bp.move_east()
        elif msg['c'] == 'w':
            bp = self.players[msg['p']] 
            bp.move_west()
        elif msg['c'] == 'b':
            bp = self.players[msg['p']] 
            bp.drop_bomb()
        elif msg['c'] == '0':
            for p in self.players:
                player = self.players[p]
                enemy = self.players[p]
                announce = {'c':'0', 'p':enemy.id, 'd':enemy.direction}
                print "ANNOUNCE", json.dumps(announce)
                enemy.session.send('websocket', json.dumps(announce))
        #print msg
           

app = BomberTab('tcp://192.168.0.6:5000', 'blast1')
app.run()
