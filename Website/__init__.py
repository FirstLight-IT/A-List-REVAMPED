from flask import Flask, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

db = SQLAlchemy() #Creates db object (defines models, handles queries, manage sessions)
login_manager = LoginManager()

def getApp():
    app = Flask(__name__, template_folder='templates')

    app.config['SECRET_KEY'] = "TeamFirstLight"
    #connects the our database to the app - using SQLite and store data in app.db
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///app.db"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    login_manager.init_app(app)

    login_manager.login_view = 'routes.login'
    login_manager.login_message = "You must log in to access this page."
    login_manager.login_message_category = "error"


    from .models import User
    from .routes import bp
    app.register_blueprint(bp)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    @app.after_request
    def add_no_cache_headers(response):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response


    return app
