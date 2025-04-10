"use client"

import { useState, useEffect } from "react"
import { Clock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"

// Type definitions
interface Team {
  name: string
  logo: string
  color: string
  secondaryColor: string
  score: number
  players?: Player[]
}

interface Game {
  id: string | number
  homeTeam: Team
  awayTeam: Team
  time: string
  status: string
}

interface Player {
  name: string
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  fg: string
  threes: string
  ft: string
}

export default function NBAGames() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBoxScore, setShowBoxScore] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [boxScoreLoading, setBoxScoreLoading] = useState(false)

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('/api/nba')
        if (!response.ok) {
          throw new Error('Failed to fetch games')
        }
        const data = await response.json()
        console.log('Fetched games data:', data)
        setGames(data.games)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching games:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch games')
        setLoading(false)
      }
    }

    fetchGames()

    // Refresh data every minute
    const interval = setInterval(fetchGames, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleGameClick = async (game: Game) => {
    console.log('Clicked game:', game)
    setSelectedGame(game)
    setShowBoxScore(true)
    setBoxScoreLoading(true)

    try {
      const response = await fetch(`/api/nba/boxscore?gameId=${game.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch box score')
      }
      const data = await response.json()
      console.log('Box score data:', data)
      console.log('Away team players count:', data.awayTeam.players.length)
      console.log('Home team players count:', data.homeTeam.players.length)

      // Update the selected game with real player data
      setSelectedGame(prev => {
        if (!prev) return null
        
        // Sort players by points scored
        const awayPlayers = [...data.awayTeam.players].sort((a, b) => b.points - a.points)
        const homePlayers = [...data.homeTeam.players].sort((a, b) => b.points - a.points)
        
        console.log('Processed away players:', awayPlayers)
        console.log('Processed home players:', homePlayers)
        
        return {
          ...prev,
          homeTeam: {
            ...prev.homeTeam,
            players: homePlayers
          },
          awayTeam: {
            ...prev.awayTeam,
            players: awayPlayers
          }
        }
      })
    } catch (error) {
      console.error('Error fetching box score:', error)
    } finally {
      setBoxScoreLoading(false)
    }
  }

  const renderPlayers = (players: Player[] | undefined) => {
    if (!players || players.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={9} className="text-center py-4">No player data available</TableCell>
        </TableRow>
      )
    }
    return players.map((player) => (
      <TableRow key={player.name} className="border-t border-gray-800 hover:bg-gray-800/50">
        <TableCell className="text-sm text-left pl-0 font-medium py-2 text-white">{player.name}</TableCell>
        <TableCell className="text-center text-sm font-semibold py-2 text-white">{player.points}</TableCell>
        <TableCell className="text-center text-sm py-2 text-white">{player.rebounds}</TableCell>
        <TableCell className="text-center text-sm py-2 text-white">{player.assists}</TableCell>
        <TableCell className="text-center text-sm py-2 text-white">{player.steals}</TableCell>
        <TableCell className="text-center text-sm py-2 text-white">{player.blocks}</TableCell>
        <TableCell className="text-center text-sm py-2 text-white">{player.fg}</TableCell>
        <TableCell className="text-center text-sm py-2 text-white">{player.threes}</TableCell>
        <TableCell className="text-center text-sm py-2 text-white">{player.ft}</TableCell>
      </TableRow>
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-xl">Loading games...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-xl">No games scheduled for today</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">NBA Games</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card 
              key={game.id}
              className="bg-gray-800 border-gray-700 overflow-hidden cursor-pointer hover:bg-gray-700/50 transition-colors rounded-lg shadow-lg"
              onClick={() => handleGameClick(game)}
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-500">{game.time}</span>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-4 w-full">
                    {/* Away Team */}
                    <div
                      className="text-center p-4 rounded-lg bg-gray-700"
                      style={{ backgroundColor: game.awayTeam.color }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative w-12 h-12">
                          <Image
                            src={game.awayTeam.logo}
                            alt={game.awayTeam.name}
                            fill
                            className="object-contain drop-shadow-lg"
                          />
                        </div>
                        <h3 className="text-sm font-semibold text-white">{game.awayTeam.name}</h3>
                        <div
                          className="text-2xl font-bold"
                          style={{ color: game.awayTeam.secondaryColor }}
                        >
                          {game.awayTeam.score}
                        </div>
                      </div>
                    </div>

                    {/* Home Team */}
                    <div
                      className="text-center p-4 rounded-lg bg-gray-700"
                      style={{ backgroundColor: game.homeTeam.color }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative w-12 h-12">
                          <Image
                            src={game.homeTeam.logo}
                            alt={game.homeTeam.name}
                            fill
                            className="object-contain drop-shadow-lg"
                          />
                        </div>
                        <h3 className="text-sm font-semibold text-white">{game.homeTeam.name}</h3>
                        <div
                          className="text-2xl font-bold"
                          style={{ color: game.homeTeam.secondaryColor }}
                        >
                          {game.homeTeam.score}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Player Stats Modal */}
      <Dialog open={showBoxScore} onOpenChange={setShowBoxScore}>
        <DialogContent className="bg-gray-900/95 text-white fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[1400px] min-w-[1000px] h-[600px] rounded-lg border border-gray-700">
          <DialogHeader className="flex flex-row justify-center items-center mb-4 px-8 pt-6">
            <DialogTitle className="text-2xl font-bold text-center flex-1">
              {selectedGame?.awayTeam.name} vs {selectedGame?.homeTeam.name}
            </DialogTitle>
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white absolute right-6 top-6"
              onClick={() => setShowBoxScore(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </Button>
          </DialogHeader>
          
          {boxScoreLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-xl">Loading box score...</div>
            </div>
          ) : (
            <div className="flex gap-8 px-8 h-[calc(100%-80px)] overflow-y-auto">
              {/* Away Team Stats */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4 sticky top-0 bg-gray-900 py-2 z-20" style={{ color: selectedGame?.awayTeam.color }}>
                  {selectedGame?.awayTeam.name}
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-900 z-20">
                      <TableRow className="border-b border-gray-800">
                        <TableHead className="w-[250px] text-left pl-0 text-sm font-medium text-gray-300">Player</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">PTS</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">REB</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">AST</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">STL</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">BLK</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">FG</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">3PT</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">FT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="relative mt-2">
                      {renderPlayers(selectedGame?.awayTeam.players)}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Home Team Stats */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4 sticky top-0 bg-gray-900 py-2 z-20" style={{ color: selectedGame?.homeTeam.color }}>
                  {selectedGame?.homeTeam.name}
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-900 z-20">
                      <TableRow className="border-b border-gray-800">
                        <TableHead className="w-[250px] text-left pl-0 text-sm font-medium text-gray-300">Player</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">PTS</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">REB</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">AST</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">STL</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">BLK</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">FG</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">3PT</TableHead>
                        <TableHead className="text-center w-[60px] text-sm font-medium text-gray-300">FT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="relative mt-2">
                      {renderPlayers(selectedGame?.homeTeam.players)}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

