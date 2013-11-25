# -*- coding: utf-8 -*-
import flask
import random

app = flask.Flask(__name__, static_url_path='')

quotes = [
u"""Happy Valentine's Day, Yoko!
❤ Hugs and kisses ❤

With Love,
          John ☮""",

u"""Happy Birthday Walt
Enjoy a Schräderbraü
Get well soon!""",

u"""Master Pope’s dream

Master Pope once dreamt he was an Emacs user. 
When he awoke, he exclaimed:

“I do not know if I am Tim Pope dreaming I am an Emacs user, 
or an Emacs user dreaming I am Tim Pope!”""",

u"""DUNDER MIFFLIN INC

Over 500 Sold!""",

u"""WORLD'S
BEST
BOSS""",
]

@app.route('/')
def index():
  return flask.render_template('index.html', quote = random.choice(quotes))

if __name__ == '__main__':
  app.run('0.0.0.0')
