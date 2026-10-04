from unittest.mock import Mock
from uuid import uuid4

from app.request_context import (
    current_actor_id,
    current_session,
    reset_actor,
    reset_session,
    set_actor,
    set_session,
)


def test_reset_restores_none() -> None:
    actor = uuid4()
    session = Mock()
    actor_token = set_actor(actor)
    session_token = set_session(session)
    assert current_actor_id() == actor
    assert current_session() is session
    reset_actor(actor_token)
    reset_session(session_token)
    assert current_actor_id() is None
    assert current_session() is None


def test_inner_reset_keeps_the_outer_value() -> None:
    outer_id = uuid4()
    inner_id = uuid4()
    outer = set_actor(outer_id)
    try:
        inner = set_actor(inner_id)
        assert current_actor_id() == inner_id
        reset_actor(inner)
        assert current_actor_id() == outer_id
    finally:
        reset_actor(outer)
    assert current_actor_id() is None
