from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared rate limiter instance. Kept in its own module (rather than app.main) so
# that route modules like app.ents.user.auth can import it without creating a
# circular import (app.main -> app.ents.api -> ...auth -> app.main).
limiter = Limiter(key_func=get_remote_address)
