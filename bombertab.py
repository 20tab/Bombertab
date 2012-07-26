from tremolo import TremoloApp
import simplejson as json

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
    0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,1,0,1,0,1,0,1,0,1,0,1,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,1,0,1,0,1,0,1,0,1,0,1,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,1,0,1,0,1,0,1,0,1,0,1,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,1,0,1,0,1,0,1,0,1,0,1,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,1,0,1,0,1,0,1,0,1,0,1,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,1,0,1,0,1,0,1,0,1,0,1,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,
]

class BomberPlayer():

    def __init__(self, game, session):
        self.id = game.pc
        self.game = game
        self.pos = 0
        self.w = 50
        self.h = 70
        self.x = 0
        self.y = self.game.arena_block - self.h
        self.speed = 7
        self.session = session

    def collision(self, x1, y1, w1, h1, x2, y2, w2, h2):
        if (y1 + h1) < y2: return 0
        if y1 > (y2 + h2): return 0
	if (x1 + w1) < x2: return 0
        if x1 > (x2+w2): return 0
        return 1

    def get_pos(self, x, y):
        center_x = (x + self.w/2) / self.game.arena_block
        center_y = (y + (self.h-self.game.arena_block) + (self.game.arena_block/2)) / self.game.arena_block
	return (center_y*13)+center_x

    def move_north(self):
        if self.y-self.speed > -20:
            coll = self.collide(self.x, self.y-self.speed)
            if not coll:
                self.y -= self.speed
                self.redraw()
            else:
                coll_x = (coll%13)*50
                feet_x = self.x
                if feet_x > coll_x+25:
                    self.move_east()
                else:
                    self.move_west()
        else:
            self.y = -20
            self.redraw()

    def move_south(self):
        if self.y+self.h+self.speed < self.game.arena_h:
            coll = self.collide(self.x, self.y+20+self.speed)
            if not coll:
                self.y += self.speed
                self.redraw()
            else:
                coll_x = (coll%13)*50
                feet_x = self.x
                if feet_x > coll_x+25:
                    self.move_east()
                else:
                    self.move_west()
        else:
            self.y = self.game.arena_h-self.h
            self.redraw()

    def collide(self, x, y):
        for i in range(0, len(self.game.arena)):
            x2 = (i%13) * 50
            y2 = (i/13) * 50
            if self.game.arena[i] != 0 and self.collision(x+5,y+5, 40, 40, x2, y2, 50, 50):
                return i
        return None

    def move_east(self):
        if self.x+self.w+self.speed < self.game.arena_w:
            coll = self.collide(self.x+self.speed, self.y+20)
            if not coll:
                self.x += self.speed
                self.redraw()
            else:
                coll_y = (coll/13)*50
                feet_y = self.y+self.h
                if feet_y > coll_y+25:
                    self.move_south()
                else:
                    self.move_north()
        else:
            self.x = self.game.arena_w-50
            self.redraw()

    def move_west(self):
        if self.x-self.speed >0:
            coll = self.collide(self.x-self.speed, self.y+20)
            if not coll:
                self.x -= self.speed
                self.redraw()
            else:
                coll_y = (coll/13)*50
                feet_y = self.y+self.h
                if feet_y > coll_y+25:
                    self.move_south()
                else:
                    self.move_north()
        else:
            self.x = 0
            self.redraw()

    def redraw(self):
        msg = {'c':'m', 'p':self.id, 'x':self.x, 'y':self.y}
        for player in self.game.players:
            #print player
            p = self.game.players[player]
            p.session.send('websocket', json.dumps(msg))

class BomberTab(TremoloApp):

    players = {}
    arena = bomber_arena
    pc = 0
    arena_block = 50
    arena_w = 50*13
    arena_h = 50*13

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
        #print msg
           

app = BomberTab('tcp://192.168.173.5:5000', 'FOOBAR1')
app.run()
