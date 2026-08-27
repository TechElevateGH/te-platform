import unittest
from datetime import datetime

from app.ents.learning.crud import get_effective_current_streak


class LearningManagementTests(unittest.TestCase):
    def test_current_streak_remains_active_today_or_yesterday(self):
        now = datetime(2025, 1, 10, 12, 0)

        self.assertEqual(
            get_effective_current_streak(
                {"current_streak": 5, "last_activity_date": "2025-01-10"},
                now=now,
            ),
            5,
        )
        self.assertEqual(
            get_effective_current_streak(
                {"current_streak": 5, "last_activity_date": "2025-01-09"},
                now=now,
            ),
            5,
        )

    def test_expired_or_invalid_streak_is_not_active(self):
        now = datetime(2025, 1, 10, 12, 0)

        self.assertEqual(
            get_effective_current_streak(
                {"current_streak": 5, "last_activity_date": "2025-01-08"},
                now=now,
            ),
            0,
        )
        self.assertEqual(
            get_effective_current_streak(
                {"current_streak": 5, "last_activity_date": "not-a-date"},
                now=now,
            ),
            0,
        )


if __name__ == "__main__":
    unittest.main()
