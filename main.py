# -*- coding: utf-8 -*-
import flask
import random

app = flask.Flask(__name__, static_url_path='')

presets = [
("Dancing Script", u"""
Happy Valentine's Day, Yoko!
❤ Hugs and kisses ❤

With Love,
          John ☮""", 36),

("Open Sans", u"""
Happy Birthday Walt
Enjoy a Schräderbraü
Get well soon!""", 36),

("Josefin Sans", u"""Master Pope’s dream

Master Pope once dreamt 
he was an Emacs user. 
When he awoke, he exclaimed:

“I do not know if I am Tim Pope
dreaming I am an Emacs user, 
or an Emacs user 
dreaming I am Tim Pope!”""", 24),

("Lobster", u"""DUNDER MIFFLIN INC

Over 500 Sold!""", 64),

("Monsieur La Doulaise", u"""
Three Rings for the Elven-kings under the sky,
Seven for the Dwarf-lords in their halls of stone,
Nine for Mortal Men doomed to die,
One for the Dark Lord on his dark throne
In the Land of Mordor where the Shadows lie.

One Ring to rule them all, One Ring to find them,
One Ring to bring them all and in the darkness bind them

In the Land of Mordor where the Shadows lie.
""", 32),

("Oswald", u"""
WORLD'S
BEST
BOSS""", 72),

("Trade Winds", u"""
BEERCRAFT BREWING COMPANY

JOHN JOHNSON

EMPLOYEE OF THE MONTH
""", 48),

("Tangerine", u"""
Edmure & Roslin
June 12, 2014
""", 72),

("Monsieur La Doulaise", u"""
When I was shown the charts and diagrams, 
to add, divide, and measure them,
When I sitting heard the astronomer where he lectured 
with much applause in the lecture-room,
How soon unaccountable I became tired and sick,
Till rising and gliding out 
I wander’d off by myself,
In the mystical moist night-air

           -W.W
""", 32)
]

@app.route('/')
def index():
  font, quote, size = random.choice(presets)
  return flask.render_template('index.html', quote=quote.strip(), font=font, size=size)

@app.route('/buy')
def buy():
  return flask.render_template('buy.html')

if __name__ == '__main__':
  app.run('0.0.0.0')
