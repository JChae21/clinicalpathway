import json

x = {}

def genJson(path, type):
	file = open(path, 'r')

	x[type] = {}
	x[type]["clusters"] = []
	x[type]["topics"] = []

	count = 0
	while True:
		line = file.readline()
		if not line:
			break

		if "Cluster #" in line:	# Cluster #0
			c = line.find("#")
			cluster = {"id": line[c+1]}
			topics = []
			count = 0
			while True:
				count += 1
				line = file.readline()	# Topic #8:>>>55.89
				t = line.find("#")
				dist = line.find(">>>")
				topics.append({"id": line[t+1], "dist": line[dist+3:].strip()})
				if count == 4:
					break
			cluster["topics"] = topics
			x[type]["clusters"].append(cluster)
		if len(x[type]["clusters"]) == 8:
			break

	while True:
		line = file.readline()
		if not line:
			break	

		if "Topic #" in line:
			t = line.find("#")
			topic = {"id": line[t+1]}
			terms = []
			count = 0
			while True:
				count += 1
				line = file.readline()	# fenofibrate>>>0.49
				# print(line)
				items = line.split(">>>")
				terms.append({"term": items[0], "dist": items[1].strip()})
				if count == 5:
					break
			topic["terms"] = terms
			x[type]["topics"].append(topic)

	file.close()

genJson("data/medication.txt", "medication")
genJson("data/lab.txt", "lab")
genJson("data/radiology.txt", "radiology")
with open('annotation.json', 'w') as outfile:
	json.dump(x, outfile)

