from __future__ import annotations

import unittest

from worldcup_tracker.scoring import build_tracker_outputs, score_entry


SCORING_RULES = {
    "groupStage": {
        "correctPositionPerTeam": 50,
        "perfectGroupBonus": 30,
        "correctThirdPlaceQualifierPerTeam": 15,
    },
    "knockout": {
        "roundOf16": 20,
        "quarterfinal": 30,
        "semifinal": 40,
        "final": 75,
        "champion": 100,
    },
}


class ScoringTests(unittest.TestCase):
    def test_group_stage_scoring_counts_positions_and_perfect_groups(self) -> None:
        entry = {
            "id": "alpha",
            "displayName": "Alpha",
            "groupStage": {
                "groups": {
                    "A": ["A1", "A2", "A3", "A4"],
                    "B": ["B1", "B2", "B3", "B4"],
                }
            },
            "knockout": {
                "roundOf32Winners": [],
                "roundOf16Winners": [],
                "quarterfinalWinners": [],
                "semifinalWinners": [],
                "champion": None,
            },
        }
        actual_results = {
            "groupStage": {
                "groups": {
                    "A": {"finalized": True, "standings": ["A1", "A2", "A3", "A4"]},
                    "B": {"finalized": True, "standings": ["B2", "B1", "B3", "B4"]},
                }
            },
            "knockout": {},
        }

        scored = score_entry(entry, actual_results, SCORING_RULES)

        self.assertEqual(scored["points"]["groupStage"], 330)
        self.assertEqual(scored["groupStage"]["correctPositions"], 6)
        self.assertEqual(scored["groupStage"]["perfectGroups"], ["A"])
        self.assertEqual(scored["groupStage"]["pointsByGroup"], {"A": 230, "B": 100})

    def test_team_name_aliases_are_normalized_when_scoring(self) -> None:
        # Predictions spell the nation "Bosnia-Herzegovina" while the actual
        # results use the canonical FIFA spelling "Bosnia and Herzegovina".
        entry = {
            "id": "liz",
            "displayName": "Liz",
            "groupStage": {
                "groups": {
                    "B": ["Switzerland", "Canada", "Bosnia-Herzegovina", "Qatar"],
                }
            },
            "knockout": {
                "roundOf32Winners": ["Bosnia-Herzegovina"],
                "roundOf16Winners": [],
                "quarterfinalWinners": [],
                "semifinalWinners": [],
                "champion": "Bosnia-Herzegovina",
            },
        }
        actual_results = {
            "groupStage": {
                "groups": {
                    "B": {
                        "finalized": True,
                        "standings": ["Switzerland", "Canada", "Bosnia and Herzegovina", "Qatar"],
                    },
                }
            },
            "knockout": {
                "roundOf16Teams": ["Bosnia and Herzegovina"],
                "quarterfinalTeams": [],
                "semifinalTeams": [],
                "finalTeams": ["Bosnia and Herzegovina"],
                "champion": "Bosnia and Herzegovina",
            },
        }

        scored = score_entry(entry, actual_results, SCORING_RULES)

        # All four positions match and the group is perfect: 4 * 50 + 30 = 230.
        self.assertEqual(scored["groupStage"]["correctPositionsByGroup"]["B"], 4)
        self.assertEqual(scored["groupStage"]["perfectGroups"], ["B"])
        self.assertEqual(scored["groupStage"]["pointsByGroup"]["B"], 230)
        # The aliased team is credited in the knockout round and as champion.
        self.assertEqual(
            scored["knockout"]["roundOf16"]["correctTeams"], ["Bosnia and Herzegovina"]
        )
        self.assertTrue(scored["knockout"]["champion"]["correct"])

    def test_knockout_scoring_is_team_based_by_round(self) -> None:
        entry = {
            "id": "alpha",
            "displayName": "Alpha",
            "groupStage": {"groups": {}},
            "knockout": {
                "roundOf32Winners": ["Mexico", "France", "USA"],
                "roundOf16Winners": ["Mexico", "France"],
                "quarterfinalWinners": ["Mexico"],
                "semifinalWinners": ["Mexico"],
                "champion": "Mexico",
            },
        }
        actual_results = {
            "groupStage": {"groups": {}},
            "knockout": {
                "roundOf16Teams": ["Mexico", "USA", "Brazil"],
                "quarterfinalTeams": ["Mexico", "Brazil"],
                "semifinalTeams": ["Brazil", "Argentina"],
                "finalTeams": ["Brazil", "Mexico"],
                "champion": "Brazil",
            },
        }

        scored = score_entry(entry, actual_results, SCORING_RULES)

        self.assertEqual(scored["points"]["knockout"], 145)
        self.assertEqual(scored["knockout"]["roundOf16"]["correctTeams"], ["Mexico", "USA"])
        self.assertEqual(scored["knockout"]["quarterfinal"]["correctTeams"], ["Mexico"])
        self.assertFalse(scored["knockout"]["champion"]["correct"])

    def test_partial_results_only_score_known_progress(self) -> None:
        entry = {
            "id": "alpha",
            "displayName": "Alpha",
            "groupStage": {"groups": {"A": ["A1", "A2", "A3", "A4"]}},
            "knockout": {
                "roundOf32Winners": ["Mexico", "USA"],
                "roundOf16Winners": ["Mexico"],
                "quarterfinalWinners": ["Mexico"],
                "semifinalWinners": ["Mexico"],
                "champion": "Mexico",
            },
        }
        actual_results = {
            "groupStage": {
                "groups": {"A": {"finalized": False, "standings": ["A1", "A2", "A3", "A4"]}}
            },
            "knockout": {
                "roundOf16Teams": ["Mexico"],
                "quarterfinalTeams": [],
                "semifinalTeams": [],
                "finalTeams": [],
                "champion": None,
            },
        }

        scored = score_entry(entry, actual_results, SCORING_RULES)

        self.assertEqual(scored["points"]["groupStage"], 0)
        self.assertEqual(scored["points"]["knockout"], 20)
        self.assertEqual(scored["knockout"]["roundOf16"]["correctTeams"], ["Mexico"])

    def test_projected_totals_include_pending_group_standings(self) -> None:
        brackets_doc = {
            "entries": [
                {
                    "id": "alpha",
                    "displayName": "Alpha",
                    "groupStage": {
                        "groups": {
                            "A": ["A1", "A2", "A3", "A4"],
                            "B": ["B1", "B2", "B3", "B4"],
                        }
                    },
                    "knockout": {
                        "roundOf32Winners": [],
                        "roundOf16Winners": [],
                        "quarterfinalWinners": [],
                        "semifinalWinners": [],
                        "champion": None,
                    },
                }
            ]
        }
        actual_results = {
            "metadata": {"asOf": None},
            "groupStage": {
                "groups": {
                    "A": {"finalized": True, "standings": ["A1", "A2", "A3", "A4"]},
                    "B": {"finalized": False, "standings": ["B1", "B2", "B4", "B3"]},
                }
            },
            "knockout": {
                "roundOf16Teams": [],
                "quarterfinalTeams": [],
                "semifinalTeams": [],
                "finalTeams": [],
                "champion": None,
            },
        }

        outputs = build_tracker_outputs(brackets_doc, actual_results, SCORING_RULES)
        row = outputs["leaderboard"]["leaderboard"][0]

        self.assertEqual(row["totalPoints"], 230)
        self.assertEqual(row["projectedTotalPoints"], 330)
        self.assertEqual(row["projectedAdditionalPoints"], 100)

    def test_group_stage_scoring_includes_third_place_qualifiers(self) -> None:
        entry = {
            "id": "alpha",
            "displayName": "Alpha",
            "groupStage": {
                "groups": {
                    "A": ["A1", "A2", "A3", "A4"],
                },
                "selectedBestThirdPlacedTeams": [
                    "T1",
                    "T2",
                    "T3",
                    "T4",
                    "T5",
                    "T6",
                    "T7",
                    "T8",
                ],
            },
            "knockout": {
                "roundOf32Winners": [],
                "roundOf16Winners": [],
                "quarterfinalWinners": [],
                "semifinalWinners": [],
                "champion": None,
            },
        }
        actual_results = {
            "groupStage": {
                "groups": {
                    "A": {"finalized": True, "standings": ["A1", "A2", "A3", "A4"]},
                },
                "bestThirdPlacedTeams": ["T1", "T3", "T5", "T7", "U1", "U2", "U3", "U4"],
            },
            "knockout": {},
        }

        scored = score_entry(entry, actual_results, SCORING_RULES)

        self.assertEqual(
            scored["groupStage"]["thirdPlaceQualifiers"]["correctTeams"],
            ["T1", "T3", "T5", "T7"],
        )
        self.assertEqual(scored["groupStage"]["thirdPlaceQualifiers"]["correctCount"], 4)
        self.assertEqual(scored["groupStage"]["thirdPlaceQualifiers"]["points"], 60)
        self.assertTrue(scored["groupStage"]["thirdPlaceQualifiers"]["scored"])
        self.assertEqual(scored["points"]["groupStage"], 290)

    def test_third_place_aliases_are_normalized_when_scoring(self) -> None:
        entry = {
            "id": "alpha",
            "displayName": "Alpha",
            "groupStage": {
                "groups": {
                    "A": ["A1", "A2", "A3", "A4"],
                },
                "selectedBestThirdPlacedTeams": ["Bosnia-Herzegovina"],
            },
            "knockout": {
                "roundOf32Winners": [],
                "roundOf16Winners": [],
                "quarterfinalWinners": [],
                "semifinalWinners": [],
                "champion": None,
            },
        }
        actual_results = {
            "groupStage": {
                "groups": {
                    "A": {"finalized": True, "standings": ["A1", "A2", "A3", "A4"]},
                },
                "bestThirdPlacedTeams": ["Bosnia and Herzegovina"],
            },
            "knockout": {},
        }

        scored = score_entry(entry, actual_results, SCORING_RULES)

        self.assertEqual(
            scored["groupStage"]["thirdPlaceQualifiers"]["correctTeams"],
            ["Bosnia and Herzegovina"],
        )
        self.assertEqual(scored["groupStage"]["thirdPlaceQualifiers"]["points"], 15)

    def test_projected_totals_include_pending_third_place_qualifiers(self) -> None:
        brackets_doc = {
            "entries": [
                {
                    "id": "alpha",
                    "displayName": "Alpha",
                    "groupStage": {
                        "groups": {
                            "A": ["A1", "A2", "A3", "A4"],
                        },
                        "selectedBestThirdPlacedTeams": [
                            "T1",
                            "T2",
                            "T3",
                            "T4",
                            "T5",
                            "T6",
                            "T7",
                            "T8",
                        ],
                    },
                    "knockout": {
                        "roundOf32Winners": [],
                        "roundOf16Winners": [],
                        "quarterfinalWinners": [],
                        "semifinalWinners": [],
                        "champion": None,
                    },
                }
            ]
        }
        actual_results = {
            "metadata": {"asOf": None},
            "groupStage": {
                "groups": {
                    "A": {"finalized": True, "standings": ["A1", "A2", "A3", "A4"]},
                    "B": {"finalized": False, "standings": ["B1", "B2", "B3", "B4"]},
                },
                "bestThirdPlacedTeams": ["T1", "T3", "T5", "T7", "U1", "U2", "U3", "U4"],
            },
            "knockout": {
                "roundOf16Teams": [],
                "quarterfinalTeams": [],
                "semifinalTeams": [],
                "finalTeams": [],
                "champion": None,
            },
        }

        outputs = build_tracker_outputs(brackets_doc, actual_results, SCORING_RULES)
        row = outputs["leaderboard"]["leaderboard"][0]
        entry = outputs["entryProgress"]["entries"][0]

        self.assertEqual(row["groupStagePoints"], 230)
        self.assertEqual(row["projectedTotalPoints"], 290)
        self.assertEqual(row["projectedAdditionalPoints"], 60)
        self.assertFalse(entry["groupStage"]["thirdPlaceQualifiers"]["scored"])
        self.assertEqual(entry["groupStage"]["thirdPlaceQualifiers"]["correctCount"], 4)

    def test_leaderboard_is_sorted_by_points_then_name(self) -> None:
        brackets_doc = {
            "entries": [
                {
                    "id": "zeta",
                    "displayName": "Zeta",
                    "groupStage": {"groups": {"A": ["A1", "A2", "A3", "A4"]}},
                    "knockout": {
                        "roundOf32Winners": [],
                        "roundOf16Winners": [],
                        "quarterfinalWinners": [],
                        "semifinalWinners": [],
                        "champion": None,
                    },
                },
                {
                    "id": "alpha",
                    "displayName": "Alpha",
                    "groupStage": {"groups": {"A": ["A1", "A2", "A3", "A4"]}},
                    "knockout": {
                        "roundOf32Winners": [],
                        "roundOf16Winners": [],
                        "quarterfinalWinners": [],
                        "semifinalWinners": [],
                        "champion": None,
                    },
                },
            ]
        }
        actual_results = {
            "metadata": {"asOf": "2026-06-24T00:00:00Z"},
            "groupStage": {
                "groups": {"A": {"finalized": True, "standings": ["A1", "A2", "A3", "A4"]}}
            },
            "knockout": {
                "roundOf16Teams": [],
                "quarterfinalTeams": [],
                "semifinalTeams": [],
                "finalTeams": [],
                "champion": None,
            },
        }

        outputs = build_tracker_outputs(brackets_doc, actual_results, SCORING_RULES)

        leaderboard = outputs["leaderboard"]["leaderboard"]
        self.assertEqual(leaderboard[0]["displayName"], "Alpha")
        self.assertEqual(leaderboard[1]["displayName"], "Zeta")
        self.assertEqual(leaderboard[0]["rank"], 1)
        self.assertEqual(leaderboard[1]["rank"], 1)

    def test_tracker_outputs_use_explicit_generated_at_when_provided(self) -> None:
        brackets_doc = {
            "entries": [
                {
                    "id": "alpha",
                    "displayName": "Alpha",
                    "groupStage": {"groups": {}},
                    "knockout": {
                        "roundOf32Winners": [],
                        "roundOf16Winners": [],
                        "quarterfinalWinners": [],
                        "semifinalWinners": [],
                        "champion": None,
                    },
                }
            ]
        }
        actual_results = {
            "metadata": {"asOf": None},
            "groupStage": {"groups": {}},
            "knockout": {
                "roundOf16Teams": [],
                "quarterfinalTeams": [],
                "semifinalTeams": [],
                "finalTeams": [],
                "champion": None,
            },
        }

        outputs = build_tracker_outputs(
            brackets_doc,
            actual_results,
            SCORING_RULES,
            generated_at="2026-06-24T20:00:00Z",
        )

        self.assertEqual(outputs["leaderboard"]["metadata"]["generatedAt"], "2026-06-24T20:00:00Z")
        self.assertEqual(outputs["entryProgress"]["metadata"]["generatedAt"], "2026-06-24T20:00:00Z")


if __name__ == "__main__":
    unittest.main()
