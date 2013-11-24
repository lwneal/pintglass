import flask

app = flask.Flask(__name__, static_url_path='')

@app.route('/')
def index():
  return flask.render_template('index.html')

if __name__ == '__main__':
  app.run('0.0.0.0')
