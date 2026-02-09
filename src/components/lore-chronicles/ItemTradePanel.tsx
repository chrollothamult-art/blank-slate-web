import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightLeft, Check, X, Package, Send, Plus, Minus, MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useItemTrading, TradeItem, TradeOffer } from "@/hooks/useItemTrading";
import { InventoryEntry } from "@/hooks/useInventory";

interface ItemTradePanelProps {
  sessionId: string;
  myCharacterId: string;
  myCharacterName: string;
  myInventory: InventoryEntry[];
  participants: Array<{ character_id: string; character_name: string }>;
}

export const ItemTradePanel = ({
  sessionId,
  myCharacterId,
  myCharacterName,
  myInventory,
  participants,
}: ItemTradePanelProps) => {
  const {
    pendingIncoming,
    pendingOutgoing,
    tradeOffers,
    createTradeOffer,
    respondToTrade,
    cancelTrade,
  } = useItemTrading(sessionId, myCharacterId);

  const [showNewTrade, setShowNewTrade] = useState(false);
  const [targetCharacterId, setTargetCharacterId] = useState("");
  const [offeredItems, setOfferedItems] = useState<TradeItem[]>([]);
  const [requestedItems, setRequestedItems] = useState<TradeItem[]>([]);
  const [message, setMessage] = useState("");

  const otherParticipants = participants.filter((p) => p.character_id !== myCharacterId);

  const toggleOfferItem = (entry: InventoryEntry) => {
    const existing = offeredItems.find((i) => i.item_id === entry.item_id);
    if (existing) {
      setOfferedItems(offeredItems.filter((i) => i.item_id !== entry.item_id));
    } else {
      setOfferedItems([
        ...offeredItems,
        {
          item_id: entry.item_id,
          item_name: entry.item?.name || "Unknown",
          quantity: 1,
          icon_emoji: entry.item?.icon_emoji,
        },
      ]);
    }
  };

  const updateOfferQuantity = (itemId: string, delta: number) => {
    setOfferedItems(
      offeredItems.map((i) => {
        if (i.item_id !== itemId) return i;
        const invEntry = myInventory.find((e) => e.item_id === itemId);
        const maxQty = invEntry?.quantity || 1;
        return { ...i, quantity: Math.max(1, Math.min(maxQty, i.quantity + delta)) };
      })
    );
  };

  const handleSendOffer = async () => {
    if (!targetCharacterId || offeredItems.length === 0) return;
    const success = await createTradeOffer(
      targetCharacterId,
      offeredItems,
      requestedItems,
      message.trim() || undefined
    );
    if (success) {
      setShowNewTrade(false);
      setOfferedItems([]);
      setRequestedItems([]);
      setMessage("");
      setTargetCharacterId("");
    }
  };

  const renderTradeItems = (items: TradeItem[]) => (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <Badge key={item.item_id} variant="secondary" className="text-xs gap-1">
          {item.icon_emoji || "📦"} {item.item_name} x{item.quantity}
        </Badge>
      ))}
      {items.length === 0 && (
        <span className="text-xs text-muted-foreground italic">Nothing</span>
      )}
    </div>
  );

  const getCharacterName = (id: string) => {
    if (id === myCharacterId) return myCharacterName;
    return participants.find((p) => p.character_id === id)?.character_name || "Unknown";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          Item Trading
          {pendingIncoming.length > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {pendingIncoming.length}
            </Badge>
          )}
        </h3>
        {otherParticipants.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setShowNewTrade(!showNewTrade)} className="text-xs h-7">
            <Package className="h-3 w-3 mr-1" />
            {showNewTrade ? "Cancel" : "New Trade"}
          </Button>
        )}
      </div>

      {/* New Trade Form */}
      <AnimatePresence>
        {showNewTrade && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20">
              <CardContent className="pt-4 space-y-3">
                {/* Target selection */}
                <div className="space-y-1">
                  <Label className="text-xs">Trade with:</Label>
                  <div className="flex flex-wrap gap-2">
                    {otherParticipants.map((p) => (
                      <Badge
                        key={p.character_id}
                        variant={targetCharacterId === p.character_id ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setTargetCharacterId(p.character_id)}
                      >
                        {p.character_name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Offering items */}
                <div className="space-y-1">
                  <Label className="text-xs">You offer:</Label>
                  <div className="space-y-1">
                    {myInventory.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No items in inventory</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {myInventory.map((entry) => {
                          const isSelected = offeredItems.some((i) => i.item_id === entry.item_id);
                          const offered = offeredItems.find((i) => i.item_id === entry.item_id);
                          return (
                            <div key={entry.id} className="flex items-center gap-1">
                              <Badge
                                variant={isSelected ? "default" : "outline"}
                                className="cursor-pointer text-xs"
                                onClick={() => toggleOfferItem(entry)}
                              >
                                {entry.item?.icon_emoji || "📦"} {entry.item?.name} (x{entry.quantity})
                              </Badge>
                              {isSelected && offered && (
                                <div className="flex items-center gap-0.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0"
                                    onClick={() => updateOfferQuantity(entry.item_id, -1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="text-xs w-4 text-center">{offered.quantity}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0"
                                    onClick={() => updateOfferQuantity(entry.item_id, 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1">
                  <Label className="text-xs">Message (optional):</Label>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g., 'I'll give you this for your help...'"
                    className="text-xs h-8"
                  />
                </div>

                <Button
                  size="sm"
                  className="w-full text-xs"
                  disabled={!targetCharacterId || offeredItems.length === 0}
                  onClick={handleSendOffer}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Send Trade Offer
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Incoming */}
      {pendingIncoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Incoming Offers</p>
          {pendingIncoming.map((trade) => (
            <Card key={trade.id} className="border-primary/20 bg-primary/5">
              <CardContent className="pt-3 pb-3 space-y-2">
                <p className="text-xs font-medium">
                  From: {getCharacterName(trade.from_character_id)}
                </p>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">They offer:</p>
                  {renderTradeItems(trade.offered_items)}
                </div>
                {trade.requested_items.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground">They want:</p>
                    {renderTradeItems(trade.requested_items)}
                  </div>
                )}
                {trade.message && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> "{trade.message}"
                  </p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 text-xs h-7" onClick={() => respondToTrade(trade.id, true)}>
                    <Check className="h-3 w-3 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1 text-xs h-7" onClick={() => respondToTrade(trade.id, false)}>
                    <X className="h-3 w-3 mr-1" /> Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pending Outgoing */}
      {pendingOutgoing.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Your Pending Offers</p>
          {pendingOutgoing.map((trade) => (
            <Card key={trade.id} className="border-border">
              <CardContent className="pt-3 pb-3 space-y-2">
                <p className="text-xs font-medium">
                  To: {getCharacterName(trade.to_character_id)}
                </p>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">Offering:</p>
                  {renderTradeItems(trade.offered_items)}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                  onClick={() => cancelTrade(trade.id)}
                >
                  Cancel Offer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent History */}
      {tradeOffers.filter((t) => t.status !== "pending").length > 0 && (
        <div className="space-y-1">
          <Separator />
          <p className="text-xs font-medium text-muted-foreground pt-1">Recent Trades</p>
          <ScrollArea className="h-[100px]">
            {tradeOffers
              .filter((t) => t.status !== "pending")
              .slice(0, 5)
              .map((trade) => (
                <div key={trade.id} className="flex items-center gap-2 py-1 text-xs">
                  <Badge
                    variant={trade.status === "accepted" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {trade.status}
                  </Badge>
                  <span className="text-muted-foreground">
                    {getCharacterName(trade.from_character_id)} → {getCharacterName(trade.to_character_id)}
                  </span>
                </div>
              ))}
          </ScrollArea>
        </div>
      )}

      {pendingIncoming.length === 0 && pendingOutgoing.length === 0 && !showNewTrade && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No active trades. Start a new trade with another player!
        </p>
      )}
    </div>
  );
};
